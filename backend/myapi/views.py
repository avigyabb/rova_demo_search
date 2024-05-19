from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import UploadedFile
from .serializers import UploadedFileSerializer
import os
from rest_framework.generics import ListAPIView

from openai import OpenAI
import json

# Initialize the OpenAI client
client = OpenAI(api_key='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')

import pdfplumber
import io


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
        if(is_grantapp):
            uploaded_file = UploadedFile(filename=file.name, file=file)
            uploaded_file.save()

            serializer = UploadedFileSerializer(uploaded_file)
            questions = extract_questions(serializer.data['file'])
            return Response(questions, status=status.HTTP_201_CREATED)
        else:

            uploaded_file = UploadedFile(filename=file.name, file=file)
            uploaded_file.save()

            serializer = UploadedFileSerializer(uploaded_file)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

class FileDeleteView(APIView):
    def delete(self, request, pk, *args, **kwargs):
        file = get_object_or_404(UploadedFile, pk=pk)
        file_path = file.file.path

        if os.path.exists(file_path):
            os.remove(file_path)

        file.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
