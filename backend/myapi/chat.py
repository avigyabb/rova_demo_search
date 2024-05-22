from .models import ChatHistory
import json
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from openai import OpenAI
import pdfplumber

# Initialize the OpenAI client
client = OpenAI(api_key='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') # this is for parsing templates, not used on actual data

def extract_text_from_pdf(pdf_path):
    page_texts = []
    with pdfplumber.open(pdf_path) as pdf:
        page_texts = [page.extract_text() for page in pdf.pages]
        return " ".join(page_texts)

def respond_to_message (llm, query, documents):
    all_messages = ChatHistory.objects.all()
    # message.user = 'user' or 'assistant'
    # message.message = str
    messages = [SystemMessage(content="You are a helpful grant-writing assistant. Follow the commands and answer the questions provided by the user to assist them in drafting grant applications.")]
    for message in all_messages:
        if message.user == 'user':
            messages.append(HumanMessage(content=message.message))
        elif message.user == 'assistant':
            messages.append(AIMessage(content=message.message))
    most_recent = f"Here is some helpful context: {documents}, my question is: {query}"
    messages.append(HumanMessage(content=most_recent))
    response = llm.invoke(messages)
    return response.content

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
    2) any mention of word count limit or (None if no mention), must be an integer, no text and 
    3) any mention of page limit (None if no mention), must be an integer, no text. 
    Return a JSON object for all questions which require a essay or short-answer response. You should return a 
    list of objects ONLY for those questions which require an essay/short-answer response. You may re-word the question to make it more verbose, 
    it should be clear what the question is asking so an LLM could answer it correctly.
    Not for those which require factual details or few word responses. 
    """.format(text)
    example = """\nYour return should be a JSON object for example a document with 1 question might produce the following output: \n
    {'questions':[\n
        {"description": "Describe your organization or project goals", "word_limit": 1000, "page_limit": 3},\n
    ]}"""
    extraction_prompt += example
    completion = client.chat.completions.create(
    model="gpt-4-1106-preview",
    messages=[
        {"role": "system", "content": "You are a helpful assistant that can read PDFs and extract the relevant requested information in JSON. \
         You must follow the users instructions without adding any unwanted elements or keys to the final json object."},
        {"role": "user", "content": extraction_prompt}
    ],
    response_format={"type": "json_object"}
    )
    questions = json.loads(completion.choices[0].message.content)
    return questions
