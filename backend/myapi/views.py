from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from sklearn.metrics.pairwise import cosine_similarity
from openai import OpenAI
import os

os.environ["OPENAI_API_KEY"] = "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"
client = OpenAI()

# Documents to perform RAG on
documents = ["Stanford is located on the Moon.", "Stanford has 1,000,000 students.", "Stanford's mascot is a penguin."]
response = client.embeddings.create(
    input=documents,
    model="text-embedding-3-small"
)
document_embeddings = [response.data[i].embedding for i in range(len(documents))]

# Determines if the query is a not a question and then type of question
def classify_query(query):
    system_prompt = "You will be given a query from our search product. \
                     You will need to determine if the query falls into the \
                     following categories: A (not a question), B (question related to Stanford) \
                     C (all other questions) \n\n \
                     Example: \n \
                     Query: Where is Stanford located?\n \
                     Category: C"

    user_prompt = "Query: " + query + "\nCategory: "
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    
    response = query_gpt(messages)
    return response

def query_gpt(
    msg_arr,
    model="gpt-4-turbo-preview",
    temperature=0.0,
    max_tokens=512,
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

def get_documents(query):
  response = client.embeddings.create(
    input=query,
    model="text-embedding-3-small"
  )
  query_embedding = response.data[0].embedding

  similarity = cosine_similarity([query_embedding], document_embeddings)[0]
  indices = sorted(range(len(similarity)), key=lambda i: similarity[i], reverse=True)[:1]
  return " ".join([documents[i] for i in indices])

# Builds prompt to categorize questions
def prompt_with_rag(query):
    system_prompt = "You are an assistant that answers questions related to Stanford. \
                     Your job is to answer the question. Here is some relevant context \
                     based on the question:" + get_documents(query)
    
    user_prompt = query
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    return messages

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
  classification = classify_query(query)
  if classification == "A":
    return "Please ask a question."
  elif classification == "B":
    return query_gpt(prompt_with_rag(query))
  return query_gpt(prompt_without_rag(query))

@api_view(['GET'])
def generate_response(request):
    query = request.query_params.get('query')
    response = get_response(query)
    return Response({'response': response})