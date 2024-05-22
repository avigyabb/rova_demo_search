from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import UploadedFile, ChatHistory
from .serializers import UploadedFileSerializer, ChatHistorySerializer
import os
from rest_framework.generics import ListAPIView
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

import chromadb
import PyPDF2
import docx
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
from .chat import respond_to_message, extract_questions

from langchain_community.chat_models import ChatOllama
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
from django.http import HttpResponse

llm = ChatOllama(model = 'llama3', base_url="http://ollama:11434")

embeddings = OllamaEmbeddings(model="all-minilm", base_url="http://ollama:11434") # this is smallest model, probably not best for embeddings
# embeddings = OllamaEmbeddings(model="all-minilm")

# Initialize ChromaDB Client
chroma_client = chromadb.PersistentClient(path="./chroma")
try:
    collection = chroma_client.get_collection(name="grant_docs")
except:
    collection = chroma_client.create_collection(name="grant_docs")

# Initialize the text splitter with custom parameters
custom_text_splitter = RecursiveCharacterTextSplitter(
    # Set custom chunk size
    chunk_size = 256,
    chunk_overlap  = 16,
    # Use length of the text as the size measure
    length_function = len,
    )

# OpenAI Embeddings 
def get_openai_embeddings(texts):
    doc_result = embeddings.embed_documents(texts)
    return doc_result

# Function to store documents in ChromaDB
def store_document_in_chromadb(documents):
    embeddings = get_openai_embeddings([doc['content'] for doc in documents])
    ids = [doc['id'] for doc in documents]
    contents = [doc['content'] for doc in documents]

    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=contents,
    )

# Function to read content from PDF files
def read_pdf(file_path):
    content = ""
    with open(file_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        for page_num in range(len(reader.pages)):
            page = reader.pages[page_num]
            content += page.extract_text()
    return content

# Function to read content from DOCX files
def read_docx(file_path):
    doc = docx.Document(file_path)
    content = ""
    for paragraph in doc.paragraphs:
        content += paragraph.text
    return content

# Function to delete from chroma db given id
def delete_from_chromadb(x):
    # Retrieve all entries from the collection
    all_entries = collection.get()  # Assuming collection.get() retrieves all entries
    ids = all_entries['ids']
    to_delete = [id for id in ids if id.split("_")[0].strip() in x]
    collection.delete(ids=to_delete)

# Function to chunk text using langchain's text_splitter
def chunk_text(sample):
    texts = custom_text_splitter.create_documents([sample])
    return texts

# Function to parse and store files in ChromaDB
def parse_and_store_files(file_paths, ids):
    documents = []
    for idx, file_path in enumerate(file_paths):
        if file_path.endswith(".pdf"):
            content = read_pdf(file_path)
        elif file_path.endswith(".docx"):
            content = read_docx(file_path)
        else:
            continue
        chunks = chunk_text(content)
        for jdx, chunk in enumerate(chunks):
            doc_id = str(ids[idx])+"_"+str(jdx)
            documents.append({"id": doc_id, "content": chunk.page_content})
    
    store_document_in_chromadb(documents)

# Retrieve similar documents
def retrieve_similar_documents(query, n_results=5):
    query_embedding = get_openai_embeddings([query])[0]
    results = collection.query(query_embedding, n_results=n_results)
    return results['documents']

def draft_from_questions(questions):
  questions = questions['questions']
  draft = dict()
  for q in questions:
    docs = retrieve_similar_documents(q['description'], n_results=20)
    query = """Respond to the folowing question from a grant application using the given documents and context: {}""".format(q['description'])
    response = respond_to_message(llm, query, docs)
    draft[q['description']] = response
  print(draft)
  return draft

class FileListView(ListAPIView):
    queryset = UploadedFile.objects.all()
    serializer_class = UploadedFileSerializer

class FileUploadView(APIView):
    def post(self, request, is_grantapp, *args, **kwargs):
        file = request.FILES['file'] 

        # Save the file using default storage and get the full path
        file_name = default_storage.save("uploads/" + file.name, ContentFile(file.read()))
        full_file_path = default_storage.path(file_name)

        # Ensure the file exists
        if not default_storage.exists(file_name):
            return Response({"error": "File not saved correctly"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Create an UploadedFile instance with the file path
        uploaded_file = UploadedFile(filename=file.name, file=file_name)
        uploaded_file.save()

        serializer = UploadedFileSerializer(uploaded_file)

        if is_grantapp:
            questions = extract_questions(full_file_path)
            draft = draft_from_questions(questions)
            
            # Create the PDF
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=letter)
            styles = getSampleStyleSheet()
            elements = []

            for question, answer in draft.items():
                elements.append(Paragraph(f"<b>{question}:</b>", styles['Heading2']))
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
            parse_and_store_files([full_file_path], [uploaded_file.id])
            return Response(serializer.data, status=status.HTTP_201_CREATED)

class FileDeleteView(APIView):
    def delete(self, request, pk, *args, **kwargs):
        file = get_object_or_404(UploadedFile, pk=pk)
        file_path = file.file.path
        default_storage.delete(file_path)

        if os.path.exists(file_path):
            os.remove(file_path)
        try:
            delete_from_chromadb([str(pk)])
        except:
            pass

        file.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class ChatHistoryView(ListAPIView):
    queryset = ChatHistory.objects.all()
    serializer_class = ChatHistorySerializer

# deletes the entire chat history
class ChatHistoryDeleteView(APIView):
    def delete(self, request, *args, **kwargs): 
        ChatHistory.objects.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class LlmModelView(APIView):
    def post(self, request, *args, **kwargs):
        # Save message in chat history
        message = request.data.get("body")
        chat_history = ChatHistory(user="user", message=message)
        chat_history.save()
        
        # Perform RAG
        similar_documents = str(retrieve_similar_documents(message, 5))
        response = respond_to_message(llm, message, similar_documents)

        # Save response in chat history
        chat_history = ChatHistory(user="assistant", message=response)
        chat_history.save()
        return Response({"response" : response})
    

