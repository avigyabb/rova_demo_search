from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import UploadedFile
from .serializers import UploadedFileSerializer
import os
from rest_framework.generics import ListAPIView
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

from openai import OpenAI
import json
import pdfplumber
import chromadb
import PyPDF2
import docx
from time import sleep
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Initialize the OpenAI client
client = OpenAI(api_key='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')

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
    response = client.embeddings.create(input=texts, model="text-embedding-ada-002")
    embeddings = [data.embedding for data in response.data]
    return embeddings

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
def retrieve_similar_documents(query, n_results=2):
    query_embedding = get_openai_embeddings([query])[0]
    results = collection.query(query_embedding, n_results=n_results)
    return results['documents'][0]

class FileListView(ListAPIView):
    queryset = UploadedFile.objects.all()
    serializer_class = UploadedFileSerializer

def extract_text_from_pdf(pdf_path):
    page_texts = []
    with pdfplumber.open(pdf_path) as pdf:
        page_texts = [page.extract_text() for page in pdf.pages]
        return " ".join(page_texts)

def extract_questions(pdf_path):
    text = extract_text_from_pdf(pdf_path)
    # Make a completion request referencing the uploaded file
    extraction_prompt = """ Given the following PDF text, \n 
    BEGINNING OF PDF:  \n 
    ********************************************************* \n
    {} \n
    ********************************************************* \n
    END OF PDF \n, 
    generate a JSON output which contains a list of 'Question' objects.
    Each question should contain a 1) description of what the question is asking, 
    2) any mention of word count limit or (None if no mention) and 
    3) any mention of page limit (None if no mention). 
    Return a JSON object for all questions which require a essay or short-answer response. You should return a 
    list of objects ONLY for those questions which require an essay/short-answer response.
    Not for those which require factual details or few word responses. 
    """.format(text)
    completion = client.chat.completions.create(
    model="gpt-4-1106-preview",
    messages=[
        {"role": "system", "content": "You are a helpful assistant that can read PDFs and extract the relevant requested information."},
        {"role": "user", "content": extraction_prompt}
    ],
    response_format={"type": "json_object"}
    )
    questions = json.loads(completion.choices[0].message.content)
    return questions

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

        if(is_grantapp):
            questions = extract_questions(full_file_path)
            parse_and_store_files([full_file_path], [uploaded_file.id])
            return Response(questions, status=status.HTTP_201_CREATED)
        else:

            parse_and_store_files([full_file_path], [uploaded_file.id])
            return Response(serializer.data, status=status.HTTP_201_CREATED)

class FileDeleteView(APIView):
    def delete(self, request, pk, *args, **kwargs):
        file = get_object_or_404(UploadedFile, pk=pk)
        file_path = file.file.path

        if os.path.exists(file_path):
            os.remove(file_path)
        delete_from_chromadb([str(pk)])

        file.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
