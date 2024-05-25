from .models import ChatHistory
import json
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain import hub
import os
from langchain.agents import AgentExecutor, create_openai_tools_agent

prompt = hub.pull("hwchase17/openai-tools-agent")


def respond_to_message (llm, query, tools, chat_session):
    agent = create_openai_tools_agent(llm, tools,prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

    all_messages = ChatHistory.objects.filter(session=chat_session)
    # message.user = 'user' or 'assistant'
    # message.message = str
    messages = [SystemMessage(content="You are a helpful grant-writing assistant. Follow the commands and answer the questions provided by the user to assist them in drafting grant applications.")]
    for message in all_messages:
        if message.user == 'user':
            messages.append(HumanMessage(content=message.message))
        elif message.user == 'assistant':
            messages.append(AIMessage(content=message.message))
    result = agent_executor.invoke({"input": query, "chat_history": messages})
    # most_recent = f"Here is some helpful context: {documents}, my question is: {query}"
    # messages.append(HumanMessage(content=most_recent))
    #response = llm.invoke(messages)
    return result["output"] #response.content

def draft_from_questions(llm, questions, tools):
  questions = questions['questions']
  draft = dict()
  for q in questions:
    query = """Respond to the folowing question from a grant application using the given documents and context: {}""".format(q['description'])
    response = respond_to_message(llm, query, tools)

    # Give draft context to assistant
    chat_history = ChatHistory(user="user", message=query)
    chat_history.save()
    chat_history = ChatHistory(user="assistant", message=response)
    chat_history.save()

    draft[q['description']] = response

  return draft