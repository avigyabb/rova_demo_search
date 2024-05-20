def respond_to_message (llm, message, documents):
    system_prompt = """The user said: \n {} \n and provided the following documents: \n {}. \n Respond to the user's query/instructions: """.format(message, documents)
    print(system_prompt)
    return llm.invoke(system_prompt)
