from langchain_community.llms import Ollama

def respond_to_message (message):
    llm = Ollama(model = 'gemma:2b')
    return llm.invoke("hello")