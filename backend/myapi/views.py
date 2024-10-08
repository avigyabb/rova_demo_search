from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import UploadedFile, ChatHistory, ChatSession
from .serializers import UploadedFileSerializer, ChatHistorySerializer, ChatSessionSerializer, UserSerializer
import os
from rest_framework.generics import ListAPIView
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
import asyncio
import threading
import json
import requests
from bs4 import BeautifulSoup

import chromadb
from langchain_openai import OpenAIEmbeddings
from .chat import respond_to_message, draft_from_questions, format_data, document_handler, extract_data_using_chatgpt
from .utils import get_openai_embeddings, read_pdf, read_docx, chunk_text, extract_questions, clear_neo4j, get_file_name_from_guess

from openai import OpenAI
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
from django.http import HttpResponse
from langchain_openai import ChatOpenAI
from langchain_core.retrievers import BaseRetriever
from langchain_core.documents import Document
from langchain.tools.retriever import create_retriever_tool
from langchain_experimental.graph_transformers import LLMGraphTransformer
from langchain_community.graphs import Neo4jGraph
from langchain_community.vectorstores import Neo4jVector
from neo4j import GraphDatabase
import pandas as pd
from pdf2image import convert_from_path
import pytesseract
from PIL import Image
from django.db.models import Q

from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny

import smtplib
from email.message import EmailMessage
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import json
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from urllib.parse import urlparse, urlunparse
from asgiref.sync import sync_to_async
import json
import asyncio

from django.contrib.auth import get_user_model
User = get_user_model()

def get_user_by_id(user_id):
    try:
        return User.objects.get(id=user_id)
    except:
        print("User not found")

# Retrieve user by user_id
def get_user_by_id(user_id):
    try:
        user = User.objects.get(id=user_id)
        return user
    except User.DoesNotExist:
        return None

class CreateUserView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        print(user)
        if user is not None:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        return Response({'error': 'Invalid Credentials'}, status=status.HTTP_401_UNAUTHORIZED)

os.environ["NEO4J_URI"] = "neo4j+s://497bdb9e.databases.neo4j.io"
os.environ["NEO4J_USERNAME"] = "neo4j"
os.environ["NEO4J_PASSWORD"] = "aRT0PlT235Yy4sM8dEAvtLiQATPt1U83en1gyMX5t8s"
# put your API key here
os.environ["OPENAI_API_KEY"] = ""

NODES = ["Person", "County", "Organization", "Initiative", "Grant", "Demography", "Benificiaries"]
RELATIONSHIPS = ["LOCATED_IN", "HELPS", "FUNDING_FOR", "SUPPORTING_RESEARCH"]
PROPS = ["text"]

driver = GraphDatabase.driver(os.environ["NEO4J_URI"], auth=(os.environ["NEO4J_USERNAME"], os.environ["NEO4J_PASSWORD"]))
llm = ChatOpenAI(model_name="gpt-4-turbo", temperature=0) #ChatOllama(model = 'qwen:0.5b') #base_url="http://ollama:11434"
llm_transformer_filtered = LLMGraphTransformer(
    llm=llm,
    allowed_nodes=NODES,
    allowed_relationships=RELATIONSHIPS,
    strict_mode=True
)
graph = None #Neo4jGraph()

embeddings_client = OpenAIEmbeddings(model="text-embedding-3-large") # base_url="http://ollama:11434" this is smallest model, probably not best for embeddings
client = OpenAI() # this is for parsing templates, not used on actual data

# Initialize ChromaDB Client
chroma_client = chromadb.PersistentClient(path="./chroma")
try:
    collection = chroma_client.get_collection(name="grant_docs")
except:
    collection = chroma_client.create_collection(name="grant_docs")

class ChromaRetriever(BaseRetriever):
    """List of documents to retrieve from."""
    k: int
    selectedFileIds: list
    user_id: int
    """Number of top results to return"""

    def update_selection(self, selectedFileIds):
        self.selectedFileIds = selectedFileIds

    # Retrieve similar documents
    def _retrieve_similar_documents_(self, query, user_id):
        print('Retrieve similar documents')
        query_embedding = get_openai_embeddings([query], embeddings_client)[0]
        if(len(self.selectedFileIds) > 0):
            results = collection.query(query_embedding, n_results=self.k, where={
                "$and": [
                    {"source_id": {"$in": self.selectedFileIds}},
                    {"user_id": {"$eq": user_id}}
                ]
            })
        else:
            results = [] #collection.query(query_embedding, n_results=self.k)
        print('results')
        print(results)
        if(len(results) > 0):
            for index in range(len(results["documents"][0])):
                document_content = results["documents"][0][index]
                document_id = results["metadatas"][0][index]["source_id"]
                print('docid')
                print(document_id)
                document = UploadedFile.objects.get(pk = document_id)
                document_handler.retrieved_documents[self.user_id].append({"name" : document.filename, "content" : document_content})
            return [Document(page_content=chunk) for chunk in results['documents'][0]] # add meta_data here?
        else:
            return []

    def _get_relevant_documents(self, query: str):
        return self._retrieve_similar_documents_(query, self.user_id)

# class Neo4jRetriever(BaseRetriever):

#     k: int
#     selectedFileIds: list

#     def update_selection(self, selectedFileIds):
#         self.selectedFileIds = selectedFileIds
#     def _get_neighborhood_(self, page_content):    
#      with driver.session() as session:
#         result = session.run("""
#         MATCH (n:Initiative)
#         WHERE n.text = $pageContent AND n.source_id IN $source_ids
#         OPTIONAL MATCH (n)-[r]-(m)
#         RETURN 
#             labels(n) AS nodeLabels,
#             n.text AS nodeText,
#             n.id AS nodeId,
#             collect({
#                 relationType: type(r),
#                 neighborLabels: labels(m),
#                 neighborText: m.text,
#                 neighborId: m.id
#             }) AS neighborhood
#         """, {'source_ids': self.selectedFileIds, 'pageContent': page_content})
#         # Immediately consume the results in a list comprehension or similar structure
#         neighborhood_data = [{
#             "nodeLabels": record["nodeLabels"],
#             "nodeText": record["nodeText"],
#             "nodeId": record["nodeId"],
#             "neighborhood": record["neighborhood"]
#         } for record in result]
#         return neighborhood_data

        
#     # Retrieve similar documents
#     def _retrieve_similar_documents_(self, query):

#         vector_index = Neo4jVector.from_existing_graph(
#             url = os.environ["NEO4J_URI"], 
#             username = os.environ["NEO4J_USERNAME"],
#             password = os.environ["NEO4J_PASSWORD"],
#             database="neo4j",
#             embedding=embeddings_client,
#             search_type="hybrid",
#             node_label="Initiative", # Central node
#             text_node_properties=PROPS,
#             embedding_node_property="embedding",
#         )

#         result = vector_index.similarity_search(query, self.k)
#         documents = []
#         for record in result:
#             text = record.page_content.split("text:", 1)[1].strip()
#             records = self._get_neighborhood_(text) # gets 1-hop neighbors, next step could be to get multi-hop neighbors (neighbors of neighbors)
#             for record in records:
#                 out = format_data(record['nodeLabels'], record['nodeId'],record['nodeText'], record['neighborhood'])
#                 documents.append(Document(page_content=out))
#         return documents

#     def _get_relevant_documents(self, query: str):
#         return self._retrieve_similar_documents_(query)


# FullDocumentRetriever Class
class FullDocumentRetriever(BaseRetriever):
    selectedFileIds: list
    user_id: int

    def update_selection(self, selectedFileIds):
        self.selectedFileIds = selectedFileIds

    # Given an approximate file name, return the most likely file name from the uploaded files from the user
    def _get_file_name_(self, file_guess):
        print('getfilename')
        # Get the list of all file names from the user
        user = get_user_by_id(self.user_id)
        file_names = UploadedFile.objects.filter(user=user).values_list('filename', flat=True)
        print(file_names)
        
        # Use GPT to find the most likely file name 
        return get_file_name_from_guess(client, file_guess, file_names)
    
    def _retrieve_full_document_(self, file_name, num_chunks = 5):
        # Grab the id for the file_name in the UploadedFile model
        try:
            print('retrievefulldocument')
            try:
                file = UploadedFile.objects.get(filename=file_name, user_id=self.user_id)
            except Exception as e:
                print(e)
            file_id = file.id

            document_handler.retrieved_documents[self.user_id].append({"name" : "[ENTIRE FILE] " + file_name, "content" : ""})

            # From collection, concatenate the first k chunks of the file
            result = collection.get(
                where={ "$and": [
                    {"source_id": {"$eq": file_id}},
                    {"user_id": {"$eq": self.user_id}}]
                })
            content = " ".join(result['documents'][:num_chunks])
            return [Document(page_content="Filename: " + file_name + "\n" + "Content: " + content + "\n")]
        except UploadedFile.DoesNotExist:
            return [Document(page_content="Could not find " + file_name + ".\n")]
        except Exception as e:
            return [Document(page_content="Could not find " + file_name + ".\n")]
        
    def _get_relevant_documents(self, file_guess: str):
        file_name = self._get_file_name_(file_guess)
        return self._retrieve_full_document_(file_name)


# SelectedDocumentsRetriever Class
class SelectedDocumentsRetriever(BaseRetriever):
    selectedFileIds: list
    user_id: int

    def update_selection(self, selectedFileIds):
        self.selectedFileIds = selectedFileIds

    def _get_relevant_documents(self, query: str):
        # Take the list of selectedFileIds and user_id and return the corresponding document names
        file_names = UploadedFile.objects.filter(id__in=self.selectedFileIds, user_id=self.user_id).values_list('filename', flat=True)
        file_tags = UploadedFile.objects.filter(id__in=self.selectedFileIds, user_id=self.user_id).values_list('file_organization', flat=True)
        files = [file_names[i] + " (tag: " + file_tags[i] + ")" for i in range(len(file_names))]

        if len(files) == 0:
            return [Document(page_content="No files selected.\n")]

        return [Document(page_content="Selected files: " + ', '.join(files) + "\n")]
    
class ToolWrapper:
    def __init__(self):
        pass
    def update(self, selectedFileIds, user_id): 
        print('updatefunc')
        print(selectedFileIds)
        retriever = ChromaRetriever(k=10, selectedFileIds=[], user_id=user_id)
        retriever.update_selection(selectedFileIds)
        # tools
        self.simple_search_tool = create_retriever_tool(
            retriever,
            "search_documents",
            "Searches and returns excerpts from the documents and files that have uploaded by the user. Useful for extracting details about specific entities."
        )
        # graph_retriever = Neo4jRetriever(k=10, selectedFileIds=[])
        # graph_retriever.update_selection(selectedFileIds)
        # self.graph_retrieval_tool = create_retriever_tool(
        #     graph_retriever,
        #     "search_graph",
        #     "Searches across a knowledge graph of documents to reveal relationships and information useful for answering broad queries. Useful for planning long-form answers and pulling pieces of evidence from multiple documents."
        # )
        file_retriever = FullDocumentRetriever(selectedFileIds=[], user_id=user_id)
        file_retriever.update_selection(selectedFileIds)
        self.file_retrieval_tool = create_retriever_tool(
            file_retriever,
            "fetch_full_document",
            "Fetches the entire content of an uploaded document or link given the filename, url, or description of it. Useful when the user mentions a specific file, url, upload in their query."
        )
        uploads_retriever = SelectedDocumentsRetriever(selectedFileIds=[], user_id=user_id)
        uploads_retriever.update_selection(selectedFileIds)
        self.uploads_retrieval_tool = create_retriever_tool(
            uploads_retriever,
            "fetch_selected_documents",
            "Fetches the names of all selected documents when query is 'documents'. Useful when a user vaguely mentions an upload without specifiying the document."
        )

        self.tools = [self.simple_search_tool, self.file_retrieval_tool, self.uploads_retrieval_tool] # self.graph_retrieval_tool 
        return self.tools

tools = ToolWrapper()

class ChromaManager():
    def __init__(self, collection):
        self.collection = collection
        self.loop = asyncio.new_event_loop()
        threading.Thread(target=self.start_loop, daemon=True).start()
    
    def start_loop(self):
        asyncio.set_event_loop(self.loop)
        self.loop.run_forever()

    # Function to delete from chroma db given id
    def delete_from_chromadb(self, x):
        self.collection.delete(where={"source_id": x})
        with driver.session() as session:
            # Cypher query to delete nodes with a specific source_id
            query = """
            MATCH (start {source_id: $source_id})
            WITH start
            MATCH (start)-[*0..]-(connected)
            WITH COLLECT(DISTINCT connected) AS connectedNodes, start
            UNWIND connectedNodes + start AS nodeToDelete
            DETACH DELETE nodeToDelete
            """
            # Execute the query
            result = session.run(query, source_id=x)
            print(f"Nodes deleted: {result.consume().counters.nodes_deleted}")
    
    # Function to store documents in ChromaDB
    def store_document_in_chromadb(self, documents):
        embeddings = get_openai_embeddings([doc['content'] for doc in documents], embeddings_client)
        ids = [doc['id'] for doc in documents]
        contents = [doc['content'] for doc in documents]
        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=contents,
            metadatas=[{"source_id": doc["source_id"], "user_id": doc["user_id"]} for doc in documents],
        )

    async def convert_to_graph_documents_and_process(self, chunks, idx):
        graph_chunks_filtered = await llm_transformer_filtered.aconvert_to_graph_documents(chunks)
        for i in range(len(graph_chunks_filtered)):
            nodes = graph_chunks_filtered[i].nodes
            for node in nodes:
                node.properties["source_id"] = idx
            print(f"Nodes:{graph_chunks_filtered[i].nodes}")
            print(f"Relationships:{graph_chunks_filtered[i].relationships}")
        graph.add_graph_documents(graph_chunks_filtered, include_source=True)

    # Shared event loop
    def handle_graph_conversion(self, chunks, idx):
        asyncio.run_coroutine_threadsafe(self.convert_to_graph_documents_and_process(chunks, idx), self.loop)

    # Function to parse file and return its content
    def parse_file(self, file_path):
        content = ""
        if file_path.endswith(".pdf"):
            content = read_pdf(file_path)
            if not content:
                images = convert_from_path(file_path)
                for img in images:
                    text = pytesseract.image_to_string(img)
                    content += text
        elif file_path.endswith(".docx"):
            content = read_docx(file_path)
        return content

    # Function to parse and store files in ChromaDB
    def parse_and_store_files(self, file_paths, ids, user_id):
        documents = []
        for idx, file_path in enumerate(file_paths):
            content = self.parse_file(file_path)
            chunks = chunk_text(content)
            for jdx, chunk in enumerate(chunks):
                doc_id = f"{ids[idx]}_{jdx}"
                documents.append({"id": doc_id, "source_id": ids[idx], "content": chunk.page_content, "user_id": user_id})
            
            # self.handle_graph_conversion(chunks, ids[idx])

        self.store_document_in_chromadb(documents)

chroma_manager = ChromaManager(collection)

class FileListView(ListAPIView):
    permission_classes = [AllowAny]
    def get_queryset(self):
        print("TEST", self.request.user)
        queryset = UploadedFile.objects.filter(user = self.request.user).all()
        # Debugging: Print each item (not recommended in production)
        for item in queryset:
            print(item)
        return queryset
    serializer_class = UploadedFileSerializer


class FileUploadView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, is_grantapp, *args, **kwargs):
        file_organization = 'reference'
        try:
            file = request.FILES['file']
            file_organization = request.POST.get('file_organization') 
        except:
            file = None
        selectedFileIds = json.loads(request.POST.get('selectedFileIds'))
        selectedFileIds = [i for i in selectedFileIds if i is not None]
        context = request.POST.get("context")
        provided_questions = request.POST.get("questions")
        #provided_questions = json.loads(request.POST.get('questions'))
        chat_session_id = int(request.POST.get('chat_session'))
        chat_session = ChatSession.objects.filter(user = request.user).get(id=chat_session_id)
        if(file is not None):
            # Check if the file already exists
            if(True):
            #if(not default_storage.exists("uploads/"+file.name) or is_grantapp):
                # Save the file using default storage and get the full path
                file_name = default_storage.save("uploads/" + file.name, ContentFile(file.read()))
                full_file_path = default_storage.path(file_name)

                # Ensure the file exists
                if not default_storage.exists(file_name):
                    return Response({"error": "File not saved correctly"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                # Create an UploadedFile instance with the file path
                uploaded_file = UploadedFile(user = request.user, filename=file.name, file=file_name, file_organization=file_organization or 'reference')
                uploaded_file.save()

                serializer = UploadedFileSerializer(uploaded_file)

                if is_grantapp:
                    questions = extract_questions(client, full_file_path, context, provided_questions)
                    draft = draft_from_questions(llm, questions, tools.update(selectedFileIds, request.user.id), chat_session, request.user)
                    
                    # Create the PDF
                    buffer = BytesIO()
                    doc = SimpleDocTemplate(buffer, pagesize=letter)
                    styles = getSampleStyleSheet()
                    elements = []

                    for question, answer in draft.items():
                        elements.append(Paragraph(f"<b>{question}</b>", styles['Heading2']))
                        elements.append(Paragraph(answer, styles['BodyText']))
                        elements.append(Spacer(1, 12))  # Add space between questions

                    doc.build(elements)

                    buffer.seek(0)

                    # Return the PDF in the response
                    response = HttpResponse(buffer, content_type='application/pdf')
                    response['Content-Disposition'] = 'attachment; filename="grant_application.pdf"'
                    uploaded_file.delete()
                    default_storage.delete(full_file_path)
                    return response
                else:
                    chroma_manager.parse_and_store_files([full_file_path], [uploaded_file.id], request.user.id)
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                print("File already exists, ignoring...")
                return Response({"error": "File already exists"}, status=status.HTTP_200_OK)
        else:
            questions = extract_questions(client, None, context, provided_questions)
            draft = draft_from_questions(llm, questions, tools.update(selectedFileIds, request.user.id), chat_session, request.user)

            # Create the PDF
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter)
            styles = getSampleStyleSheet()
            elements = []

            for question, answer in draft.items():
                elements.append(Paragraph(f"<b>{question}</b>", styles['Heading2']))
                elements.append(Paragraph(answer, styles['BodyText']))
                elements.append(Spacer(1, 12))  # Add space between questions

            doc.build(elements)

            buffer.seek(0)

            # Return the PDF in the response
            response = HttpResponse(buffer, content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="grant_application.pdf"'
            return response

class FileDeleteView(APIView):
    permission_classes = [AllowAny]
    def delete(self, request, pk, *args, **kwargs):
        print("TEST", request.user)
        file = get_object_or_404(UploadedFile, pk=pk)
        if file.file:
            file_path = file.file.path
            default_storage.delete(file_path)
            if os.path.exists(file_path):
                os.remove(file_path)

        try:
            chroma_manager.delete_from_chromadb(pk)
        except Exception as e:
            print(e)
            pass

        file.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class FileEditView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, pk, *args, **kwargs):
        print("TEST", request.user)
        file = get_object_or_404(UploadedFile, pk=pk)
        new_file_organization = request.POST.get('file_organization')
        file.file_organization = new_file_organization
        file.save()
        serializer = UploadedFileSerializer(file)
        return Response(status=status.HTTP_204_NO_CONTENT)


# delete a chat session
class ChatSessionDeleteView(APIView):
    permission_classes = [AllowAny]
    def delete(self, request, pk, *args, **kwargs):
        print("TEST", request.user)
        session = get_object_or_404(ChatSession, pk=pk)
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# gets chat history for a given session
class ChatHistoryView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, *args, **kwargs):
        print("TEST", request.user)
        session_id = request.query_params.get("session_id")
        try:
            chat_session = ChatSession.objects.filter(user = request.user).get(id=session_id)
            chat_history = ChatHistory.objects.filter(Q(user = request.user) & Q(session=chat_session))
            serializer = ChatHistorySerializer(chat_history, many=True)
            return Response(serializer.data)
        except ChatSession.DoesNotExist:
            return Response({"error": "Chat session not found"}, status=404)


class LlmModelView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        print("TEST", request.user)
        # Save message in chat history
        message = request.data.get("body")
        session_id = request.data.get("session_id")
        chat_session = ChatSession.objects.filter(user = request.user).get(id=session_id)
        selectedFileIds = json.loads(request.data.get("file_ids"))
        selectedFileIds = [i for i in selectedFileIds if i is not None]
        print('loc14')
        print(selectedFileIds)

        if('clear_neo4j' in message):
            clear_neo4j(driver)
            return Response({"response" : "neo4j cleared"})

        chat_history = ChatHistory(user = request.user, user_role="user", message=message, session=chat_session)
        chat_history.save()
        
        print('respond to message')
        print(selectedFileIds)
        response = respond_to_message(llm, message, tools.update(selectedFileIds, request.user.id), chat_session, request.user)

        # Save response in chat history
        chat_history = ChatHistory(user = request.user, user_role="assistant", message=response, documents = document_handler.retrieved_documents[request.user.id], session=chat_session)
        chat_history.save()

        document_handler.retrieved_documents[request.user.id] = []

        return Response({"response" : response})

class ChatSessionView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = ChatSessionSerializer

    def get_queryset(self):
        print("TEST", self.request.user)
        queryset = ChatSession.objects.filter(user = self.request.user).all()
        if not queryset.exists():
            # Create a chat session using the ChatSessionCreateView
            session = ChatSession(user = self.request.user, name="New Chat")
            session.save()
            # Refresh the queryset
            queryset = ChatSession.objects.filter(user = self.request.user).all()
        return queryset

# add new Chat Session
class ChatSessionCreateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        name = request.data.get("body")
        # Create new chat session and get the id and then name is Chat #id
        session = ChatSession(user = request.user, name=name)
        if not name or name == "":
            session.name = "New Chat"
        session.save()
        return Response(status=status.HTTP_201_CREATED)
    
# rename Chat session
class ChatSessionRenameView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, pk, *args, **kwargs):
        print("TEST", request.user)
        session = get_object_or_404(ChatSession, pk=pk)
        session.name = request.data.get("name")
        session.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
      
class UrlUploadView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        # Get the url and selectedFileIds from the request
        url = request.data.get('url')

        # Ensure the URL has a scheme (http or https)
        parsed_url = urlparse(url)
        if not parsed_url.scheme:
            if parsed_url.netloc:
                # The URL has a netloc but no scheme
                url = f'https://{parsed_url.netloc}{parsed_url.path}'
            else:
                # The URL is just a path (e.g., www.linkedin.com or linkedin.com)
                url = f'https://{parsed_url.path}'

        # Scrape the text from the URL
        try:
            response = requests.get(url)
            response.raise_for_status()
        except requests.exceptions.RequestException as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        soup = BeautifulSoup(response.content, 'html.parser')
        text = soup.get_text(separator=' ', strip=True)

        links = [a.get('href') for a in soup.find_all('a', href=True)]

        if not text:
            return Response({"error": "Unable to extract text from the URL"}, status=status.HTTP_400_BAD_REQUEST)

        # Store the URL in the database
        uploaded_file = UploadedFile(filename=url, file=None, file_organization='reference', user=request.user)
        uploaded_file.save()
        serializer = UploadedFileSerializer(uploaded_file)

        # Chunk and store the text in ChromaDB
        chunks = chunk_text(text)
        documents = []

        jdx = 0
        for chunk in chunks:
            doc_id = f"{uploaded_file.id}_{jdx}"
            documents.append({"id": doc_id, "source_id": uploaded_file.id, "user_id": request.user.id, "content": chunk.page_content})
            jdx += 1

        for link in links:
            try:
                response = requests.get(link)
                response.raise_for_status()
            except requests.exceptions.RequestException as e:
                continue
            soup = BeautifulSoup(response.content, 'html.parser')
            text = soup.get_text(separator=' ', strip=True)
            chunks = chunk_text(text)
            for chunk in chunks:
                doc_id = f"{uploaded_file.id}_{jdx}"
                documents.append({"id": doc_id, "source_id": uploaded_file.id, "user_id": request.user.id, "content": chunk.page_content})
                jdx += 1
        
        chroma_manager.store_document_in_chromadb(documents)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
class JoinWaitlist(APIView):  
    permission_classes = [AllowAny]  
    def post(self, request):
         # Email setup
        fromaddr = "avigyabb@gmail.com"
        toaddr = "founders@amboralabs.com"
        password = "frpt hqtd fiyj zqrn"  # Be cautious with email passwords

        # SMTP server configuration
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(fromaddr, password)

        # Create email
        msg = MIMEMultipart()
        msg['From'] = fromaddr
        msg['To'] = toaddr
        msg['Subject'] = "Somebody has joined the waitlist!"
        body = {
            "firstName": request.data.get('first_name'),
            "lastName": request.data.get('last_name'),
            "email": request.data.get('email'),
            "additionalDetails": request.data.get('additional_details'),
        }
        msg.attach(MIMEText(json.dumps(body), 'plain'))

        # Send email
        try :
            server.send_message(msg)
            print("Email sent successfully!")
        except Exception as e:
            print(e)
        server.quit()
        
        return Response({"message": "Successfully joined waitlist!"})
    

class ChatSessionUpdateEditorView(APIView):
    permission_classes = [AllowAny]
    def post(self, request, pk, *args, **kwargs):
        print("TEST", request.user)
        session = get_object_or_404(ChatSession, pk=pk)
        session.editor_backup = request.data.get("editor_backup")
        session.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ChatSessionFetchEditorView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, pk, *args, **kwargs):
        print("TEST", request.user)
        session = get_object_or_404(ChatSession, pk=pk)
        return Response({'content':session.editor_backup})
    
class DataExtractionView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        files = request.FILES.getlist('files')
        instruction = request.POST.get('instruction')

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        tasks = [self.process_file(file, instruction) for file in files]
        extracted_data = loop.run_until_complete(asyncio.gather(*tasks))

        return Response({'content': extracted_data})

    async def process_file(self, file, instruction):
        file_name = default_storage.save("uploads/data_extraction/" + file.name, ContentFile(file.read()))
        full_file_path = default_storage.path(file_name)

        file_content = read_pdf(full_file_path)
        data = await extract_data_using_chatgpt(llm, file_content, instruction)

        default_storage.delete(full_file_path)
        
        return {'file_name': file.name, 'data': data}
