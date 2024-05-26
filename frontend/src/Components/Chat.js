import React, { useEffect, useState } from "react";
import axios from 'axios';
import "../Styles/Chat.css";
import { REACT_APP_API_URL } from "../consts";

export default function Chat({ selectedSession, selectedFileIds, setSelectedFileIds, setDocuments, chatLog, setChatLog}) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inputRows, setInputRows] = useState(1);
  const [inputAreaWidth, setInputAreaWidth] = useState(0);

  const fetchChat = async () => {
    console.log(selectedSession.id);
    try {
        const response = await axios.get(`${REACT_APP_API_URL}chat-history/`, {
            params: {
                session_id: selectedSession.id,
            },
        });
      const result = await response.data;
      setChatLog(result);
    } catch (error) {
      console.error('Error fetching chat:', error);
    }
  };

  useEffect(() => {
    if (selectedSession) {
      fetchChat(selectedSession.id);
    }
  }, [selectedSession]);

  useEffect(() => {
    const chatWindowDiv = document.getElementById("chatWindowDiv");
    if (chatWindowDiv) {
      const height = chatWindowDiv.scrollHeight;
      chatWindowDiv.scrollTop = height;
    }
  }, [chatLog]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const sendMessage = async () => {
      try {
        const userChat = { user: "user", message: inputValue };
        setChatLog((prevChatLog) => [...prevChatLog, userChat]);
        setIsLoading(true);
        await axios.post(REACT_APP_API_URL + "send-message/", {
          body: inputValue,
          session_id: selectedSession.id,
          file_ids: JSON.stringify(selectedFileIds)
          
        });
        setIsLoading(false);
        setChatLog(chatLog.slice(0, -1));
        fetchChat(selectedSession.id);
      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    };
    sendMessage();
    setInputValue("");
  };

  function formatGPTMessage(message) {
    if (typeof message !== 'string') {
      return '';
    }
    const boldFormattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    const newlineFormattedMessage = boldFormattedMessage.replace(/\n/g, '<br>');
    return newlineFormattedMessage;
  }

  useEffect(() => {
    const updateWidth = () => {
      const inputArea = document.getElementById("inputArea");
      setInputAreaWidth(inputArea.offsetWidth - 70 - 16);
    };

    updateWidth();

    const inputArea = document.getElementById("inputArea");
    const resizeObserver = new ResizeObserver(updateWidth);

    if (inputArea) {
      resizeObserver.observe(inputArea);
    }

    return () => {
      if (inputArea) {
        resizeObserver.disconnect();
      }
    };
    }, []);

      useEffect (() => {
        const chatWindowDiv = document.getElementById("chatWindowDiv")
        if (chatWindowDiv) {
            const height = chatWindowDiv.scrollHeight
            chatWindowDiv.scrollTop = height
        }
      }, [chatLog])

  useEffect(() => {
    const numPixels = 9 * inputValue.length;
    const newNumRows = Math.ceil(numPixels / inputAreaWidth);
    if (newNumRows > 1) {
      if (newNumRows < 6) {
        setInputRows(newNumRows);
      } else {
        setInputRows(6);
      }
    } else {
      setInputRows(1);
    }
  }, [inputValue, inputAreaWidth]);

  const handleTyping = (event) => {
    setInputValue(event.target.value);
  };    
  
  const showDocuments = (index) => {
    //setDocuments(chatLog[index].documents)
    setDocuments([{title : "Document 1 title", content : "Document 1 content"}, {title : "Document 2 title", content : "Document 2 content"}])
    }

  return (
    <div className = "container mx-auto">
      <div className="flex flex-col bg-gray-900" style={{backgroundColor: "#e9e9e9", height : "90vh"}}>
        
        <div id="chatWindowDiv" className="flex-grow p-6" style={{ overflowY: "auto"}}>
          <div className="flex flex-col space-y-4">
            {chatLog.map((message, index) => (
              <div
                key={index}
                className={`flex flex-col justify-start`}
                style={{ fontFamily: "'Cerebri Sans', sans-serif", wordWrap: 'break-word' }}
              >
                <div className = "flex items-center">
                    <div className = {`${message.user === "user" ? "blue" : "gray"} w-8 h-8 rounded-full`}>
                    </div>
                    <div className={`chat-role font-bold ${message.user === "user" ? 'none' : 'none'} rounded-lg p-2`}>
                        {message.user}
                    </div>
                    {message.user === "assistant" &&
                    <button className = {"show-documents gray rounded-lg p-2 ml-auto"} onClick = {() => showDocuments(index)}> show sources </button>
                    }
                </div>
                <div className = {`rounded-lg p-2 text-left`} style={{alignContent : 'left'}}>
                    <div dangerouslySetInnerHTML={{ __html: formatGPTMessage(message.message) }} />
                </div>
            </div>
            ))}
            {
                isLoading &&
                <div 
                    key = {chatLog.length} 
                    className = {"flex flex-col justify-start"}
                    style = {{fontFamily: "'Cerebri Sans', sans-serif", wordWrap: 'break-word'}}
                >
                    <div className = {`chat-role gray rounded-lg p-2`}>
                        assistant
                    </div>
                    <div className = "rounded-lg p-2 text-left" style = {{alignContent: "left"}}>
                        ...
                    </div>
                </div>
            }
            </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-none p-6">
          <div style={{ position: "relative" }}>
            <div className="flex rounded-lg border border-white-700 bg-white-800">
              <textarea
                id="inputArea"
                type="text"
                className="flex-grow px-4 py-2 focus:outline-none"
                disabled={isLoading}
                style={{ fontFamily: "'Cerebri Sans', sans-serif", backgroundColor: "white", color: "gray", borderRadius: "8px", paddingRight: "70px" }}
                rows={inputRows}
                placeholder=""
                value={inputValue}
                onChange={handleTyping}
              />
              <button
                type="submit"
                className="absolute right-0 top-0 bottom-0 m-auto rounded-lg px-4 py-2 font-semibold focus:outline-none hover:bg-purple-600 transition-colors duration-300"
                style={{ background: "transparent" }}
                onMouseEnter={(e) => e.target.style.color = "lightblue"}
                onMouseLeave={(e) => e.target.style.color = "black"}
                disabled={isLoading}
              >
                Send
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
