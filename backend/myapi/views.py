from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from sklearn.metrics.pairwise import cosine_similarity
from openai import OpenAI
import os
import random
import chromadb

os.environ["OPENAI_API_KEY"] = "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"
client = OpenAI()

def query_gpt(
    msg_arr,
    model="gpt-4-turbo-preview",
    temperature=1.0,
    max_tokens=128,
):
    response = client.chat.completions.create(
        model=model,
        messages=msg_arr,
        temperature=temperature,
        max_tokens=max_tokens,
        response_format={"type": "text"},
        n=1,
        stop=None,
    )
    return response.choices[0].message.content

# Builds prompt to categorize questions
def prompt_without_rag(query):
    system_prompt = ""
    user_prompt = query
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    return messages

# Function to generate a response using OpenAI's ChatCompletion API
def get_response(query):
  messages = prompt_without_rag(query)
  output = query_gpt(messages)
  return output

@api_view(['GET'])
def generate_response(request):
    query = request.query_params.get('query')
    response = get_response(query)
    return Response({'response': response})

@api_view(["POST"])
def post_like(request):
    return Response({"message": "Received like."})

@api_view(["POST"])
def post_dislike(request):
    return Response({"message": "Received dislike."})

@api_view(["POST"])
def post_copy(request):
    return Response({"message": "Received copy."})

@api_view(["POST"])
def post_upgrade(request):
    return Response({"message": "Received upgrade."})

@api_view(["POST"])
def post_regenerate(request):
    return Response({"message": "Received regenerate."})