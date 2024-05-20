from .models import ChatHistory

def respond_to_message (llm, message, documents):
    all_messages = ChatHistory.objects.all()
    message_list = [f"User: {message.user}, Message: {message.message}" for message in all_messages]
    message_string = "\n".join(message_list)
    system_prompt = """The user said: \n {message} \n and provided the following documents: \n {documents}. The user's previous chat history is: \n {message_string}\n Respond to the user's query/instructions which is: """.format(message=message, documents=documents, message_string=message_string)
    return llm.invoke(system_prompt)
