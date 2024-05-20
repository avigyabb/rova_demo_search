from .models import ChatHistory
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage

def respond_to_message (llm, query, documents):
    all_messages = ChatHistory.objects.all()
    # message.user = 'user' or 'assistant'
    # message.message = str
    messages = [SystemMessage(content="You are a helpful assistant")]
    for message in all_messages:
        if message.user == 'user':
            messages.append(HumanMessage(content=message.message))
        elif message.user == 'assistant':
            messages.append(AIMessage(content=message.message))
    most_recent = f"Here is some helpful context: {documents}, my question is: {query}"
    messages.append(HumanMessage(content=most_recent))
    response = llm.invoke(messages)
    return response.content
