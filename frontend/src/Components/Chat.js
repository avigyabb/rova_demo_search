import React, { useEffect, useState } from "react";
import axios from 'axios';
import "../Styles/Chat.css";
import { REACT_APP_API_URL } from "../consts";
import { FaPaperPlane } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Chat({ selectedSession, selectedFileIds, setSelectedFileIds, setDocuments, chatLog, setChatLog, answerMultipleQuestions}) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inputRows, setInputRows] = useState(1);
  const [inputAreaWidth, setInputAreaWidth] = useState(0);
  const [shownSourcesIndex, setShownSourcesIndex] = useState(null);
  const [context, setContext] = useState(false);
  const [contextValue, setContextValue] = useState("")
  const [showSuggestedMessages, setShowSuggestedMessages] = useState(false);
  
  const suggestedMessages = [
    "Give me a brief summary of one of the selected documents.",
    "Use the uploaded information to tell me our mission statement.",
    "What environmental work has our organization done in the past?"
  ];

  const fetchChat = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await axios.get(`${REACT_APP_API_URL}chat-history/`, {
        params: {
          session_id: selectedSession.id,
        }, 
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });
      const result = await response.data;
      setChatLog(result);
      
      // if chat log is empty, set showSuggestedMessages to true
      if (result.length === 0) {
        setShowSuggestedMessages(true);
      } else {
        setShowSuggestedMessages(false);
      }
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
    console.log(chatLog)
  }, [chatLog]);

  const handleSubmit = (event) => {
    const accessToken = localStorage.getItem('accessToken');
    event.preventDefault();
    const sendMessage = async () => {
      setShowSuggestedMessages(false);
      try {
        setIsLoading(true);
        if (!context) {
          const userChat = { user_role: "user", message: inputValue };
          setChatLog((prevChatLog) => [...prevChatLog, userChat]);
          await axios.post(REACT_APP_API_URL + "send-message/", {
            body: inputValue,
            session_id: selectedSession.id,
            file_ids: JSON.stringify(selectedFileIds)
          }, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            }
          });
        } else {
          await answerMultipleQuestions(null, false, contextValue, inputValue, "template")
        }
        fetchChat(selectedSession.id)
        setIsLoading(false)
      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    };

    if (inputValue !== "") {
      sendMessage();
      setInputValue("");
      setContextValue("");
    }
  };

  const sendSingleMessage = async (accessToken, inputVal) => {
    setShowSuggestedMessages(false);
    try {
      setIsLoading(true);
      const userChat = { user_role: "user", message: inputVal };
      setChatLog((prevChatLog) => [...prevChatLog, userChat]);
      await axios.post(REACT_APP_API_URL + "send-message/", {
        body: inputVal,
        session_id: selectedSession.id,
        file_ids: JSON.stringify(selectedFileIds)
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });
      fetchChat(selectedSession.id)
      setIsLoading(false)
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };
  
  const handleSuggestedMessageClick = (message) => {
    const accessToken = localStorage.getItem('accessToken');
    sendSingleMessage(accessToken, message);
    setInputValue("");
    setContextValue("");
  }; 

  useEffect(() => {
    const updateWidth = () => {
      const inputArea = document.getElementById("inputArea");
      if (inputArea) {
        setInputAreaWidth(inputArea.offsetWidth - 100 - 40 - 16)
      }
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

  useEffect(() => {
    const inputLines = inputValue.split("\n")
    let newNumRows = 0
    for (let i =0; i < inputLines.length; i++) {
      if (inputLines[i].length == 0) {
        newNumRows += 1
      } else {
        const numPixels = 9 * inputLines[i].length
        newNumRows += Math.ceil(numPixels / inputAreaWidth)
      }
    }

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
    // setShowSuggestedMessages(false);
  };

  const handleContextTyping = (event) => {
    setContextValue(event.target.value);
  };

  const showDocuments = (index) => {
    if (shownSourcesIndex === index) {
      setShownSourcesIndex(null);
      setDocuments(null);
    } else {
      setShownSourcesIndex(index);
      setDocuments(chatLog[index].documents);
    }
  }

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    };

    const textarea = document.getElementById('inputArea');
    textarea.addEventListener('keydown', handleKeyDown);

    return () => {
      textarea.removeEventListener('keydown', handleKeyDown);
    };
  }, [inputValue]);

  const contextChange = (event) => {
    event.preventDefault();
    setContext(!context)
    setContextValue("")
  }

  const handleTemplateUpload = (event) => {
    event.preventDefault()
    setIsLoading(true)
    const contextForTemplate = contextValue
    answerMultipleQuestions(event, true, contextForTemplate, "", undefined).finally (() => {
      setIsLoading(false)
      setInputValue("")
    })
    setContextValue("")
  }

  return (
    <div className="container mx-auto chat-container">
      <div className="flex flex-col bg-gray-900" style={{ backgroundColor: "white", height: "93vh" }}>
        <div id="chatWindowDiv" className="flex-grow p-6" style={{ overflowY: "auto" }}>
          <div className="flex flex-col space-y-4">
            {chatLog.map((message, index) => (
              <div
                key={index}
                className={`flex flex-col justify-start`}
                style={{ 
                  fontFamily: "'Cerebri Sans', sans-serif", 
                  wordWrap: 'break-word', 
                  backgroundColor: message.user_role === "user" ? '#f0f0f0' : '', 
                  padding: message.user_role === "user" ? '8px' : '', 
                  borderRadius: message.user_role === "user" ? '15px' : '' }}
              >
                <div className="flex items-center">
                  <div className={`${message.user_role === "user" ? "blue" : "gray"} w-8 h-8 rounded-full`}></div>
                  <div className={`chat-role font-bold ${message.user_role === "user" ? 'none' : 'none'} rounded-lg p-2`}>
                    {message.user_role}
                  </div>
                  {message.user_role === "assistant" &&
                    <>
                    <p style={{ fontSize: "10px", color: "gray", fontWeight: "bold", marginLeft: "auto", marginRight: "8px" }}>
                      {message.message.length} characters
                    </p>
                    <p style={{ fontSize: "11px", fontWeight: "bold", marginRight: "15px" }}>
                      {message.message.trim().split(/\s+/).filter(word => word.length > 0).length} words
                    </p>
                    <button
                      className={`show-documents gray rounded-lg ${shownSourcesIndex === index ? 'hide-sources' : ''}`}
                      onClick={() => showDocuments(index)}
                    >
                      {shownSourcesIndex === index ? 'hide sources' : message.documents.length > 0 ? 'show sources' : "no sources used"}
                    </button>
                    </>
                  }
                </div>
                <div className={`rounded-lg p-2 text-left pre-wrap`} style={{ alignContent: 'left' }}>
                  {message.user_role === "user" ? (
                    <div>{message.message}</div>
                  ) : (
                    <ReactMarkdown
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter style={materialDark} language={match[1]} PreTag="div" {...props}>
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {message.message}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div
                key={chatLog.length}
                className={"flex flex-col justify-start"}
                style={{ fontFamily: "'Cerebri Sans', sans-serif", wordWrap: 'break-word' }}
              >
                {/* <div className={`chat-role gray rounded-lg p-2`}>assistant</div> */}
                <div className="flex items-center">
                  <div className={`gray w-8 h-8 rounded-full`}></div>
                  <div className={`chat-role font-bold rounded-lg p-2`}>
                    assistant
                  </div>
                </div>
                <div className="typing rounded-lg p-2 text-left pre-wrap pt-4" style={{ alignContent: "left" }}></div>
              </div>
            )}
          </div>
        </div>
        <form className="flex-none p-6 pt-0" onSubmit={handleSubmit}>
          {showSuggestedMessages && (
            <div className="flex justify-around mb-4 gap-4">
              {suggestedMessages.map((msg, index) => (
                <button
                  key={index}
                  type="button"
                  className="bg-gray-200 p-2 rounded mb-2 hover:bg-gray-300"
                  onClick={() => handleSuggestedMessageClick(msg)}
                >
                  {msg}
                </button>
              ))}
            </div>
          )}
          <div style={{ position: "relative" }}>
            <div className="flex border" style={{ alignItems: "center", borderRadius: "20px"}}>
              <button
                className = "flex absolute left-1 blue w-8 h-8 rounded-full"
                style = {{alignItems : "center", justifyContent : "center", zIndex : 10}}
                disabled = {isLoading}
                onClick = {contextChange}
                >
                  {context ? "\\/" : "/\\"}
              </button>
              {context ?
              <div className = "flex flex-col flex-grow">
                <textarea
                  id = "inputArea"
                  type = "text"
                  className = "flex-grow px-4 py-2 focus:outline-none"
                  disabled = {isLoading}
                  style = {{borderBottom : "1px solid", fontFamily : "'Cerebri Sans', sans-serif", paddingLeft : "40px", paddingRight : "100px", backgroundColor : "#f0f0f0"}}
                  rows = {1}
                  placeholder = "Add context here..."
                  value = {contextValue}
                  onChange = {handleContextTyping}
                />
                <div className = "flex flex-row relative items-center">
                  <textarea
                    id="inputArea"
                    type="text"
                    className="flex-grow px-4 py-2 focus:outline-none"
                    disabled={isLoading}
                    style={{ fontFamily: "'Cerebri Sans', sans-serif", paddingLeft : "40px", paddingRight : "100px", backgroundColor: '#f0f0f0' }}
                    rows={inputRows}
                    placeholder="Add questions here..."
                    value={inputValue}
                    onChange={handleTyping}
                  />
                  {inputValue.length == 0 && (
                  <label className = "upload-template absolute right-[100px]">
                    + Upload Template
                    <input
                      type="file"
                      multiple
                      onChange = {handleTemplateUpload}
                      style = {{display : "none"}}
                    >
                    </input>
                  </label>
                  )}
                </div>
              </div> :
              <textarea
                id = "inputArea"
                type = "text"
                className = "flex-grow px-4 py-2 focus:outline-none"
                disabled = {isLoading}
                style = {{fontFamily : "'Cerebri Sans', sans-serif", borderRadius : "20px", paddingLeft : "40px", paddingRight : "100px", backgroundColor : "#f0f0f0"}}
                rows = {inputRows}
                placeholder = "Ask a question..."
                value = {inputValue}
                onChange = {handleTyping}
              />
              }
              <button
                type="submit"
                className="flex absolute right-1 m-auto px-3 py-1 font-semibold focus:outline-none transition-colors duration-300"
                style={{ alignItems: "center", color: 'white', borderRadius: "20px", backgroundColor: "black" }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "gray"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "black"}
                disabled={isLoading}
                onClick = {handleSubmit}
                >
                Send
                <FaPaperPlane size={14} style={{ marginLeft: "8px" }} />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
