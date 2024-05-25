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
    messages = [SystemMessage(content="You are a helpful grant-writing assistant. \
                                       Follow the commands and answer the questions provided by the user to assist them in drafting grant applications. \
                                       Make use of all of your tools as apropriate.")]
    for message in all_messages:
        if message.user == 'user':
            messages.append(HumanMessage(content=message.message))
        elif message.user == 'assistant':
            messages.append(AIMessage(content=message.message))
    result = agent_executor.invoke({"input": query, "chat_history": messages})
    return result["output"] #response.content

def format_data(node_label, node_id, node_text, neighborhood_nodes):

    # Start building the result string with node label and node text
    result = f"{node_label[-1]}-{node_id} which is '{node_text} "
    
    # Process each neighboring node and add to the result string
    for i, neighbor in enumerate(neighborhood_nodes):
        relation_type = neighbor['relationType']
        neighbor_labels = ' and ' + f"{neighbor['neighborLabels'][-1]}-{neighbor['neighborId']}"
        neighbor_text = neighbor['neighborText']
        
        # Format relation part
        if i == 0:
            result += f" {relation_type.lower().replace('_', ' ')} {neighbor_labels}-{neighbor['neighborId']} which is '{neighbor_text}'"
        else:
            result += f", and {relation_type.lower().replace('_', ' ')} {neighbor_labels}-{neighbor['neighborId']} which is '{neighbor_text}'"
    
    return result

def draft_from_questions(llm, questions, tools, chat_session):
  questions = questions['questions']
  draft = dict()
  for q in questions:
    query = """Respond to the folowing question from a grant application using the given documents and context: {}""".format(q['description'])
    response = respond_to_message(llm, query, tools, chat_session)

    # Give draft context to assistant
    chat_history = ChatHistory(user="user", message=q['description'], session=chat_session)
    chat_history.save()
    chat_history = ChatHistory(user="assistant", message=response, session=chat_session)
    chat_history.save()

    draft[q['description']] = response

  return draft
