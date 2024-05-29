import React, { useEffect, useState } from "react";
import axios from 'axios';
import "../Styles/Chat.css";
import { REACT_APP_API_URL } from "../consts";
import { FaPaperPlane } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Chat({ selectedSession, selectedFileIds, setSelectedFileIds, setDocuments, chatLog, setChatLog }) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [inputRows, setInputRows] = useState(1);
  const [inputAreaWidth, setInputAreaWidth] = useState(0);
  const [shownSourcesIndex, setShownSourcesIndex] = useState(null);

  const fetchChat = async () => {
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
        fetchChat(selectedSession.id)
        setIsLoading(false)
      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    };
    sendMessage();
    setInputValue("");
  };

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

  return (
    <div className="container mx-auto chat-container">
      <div className="flex flex-col bg-gray-900" style={{ backgroundColor: "#e9e9e9", height: "90vh" }}>
        <div id="chatWindowDiv" className="flex-grow p-6" style={{ overflowY: "auto" }}>
          <div className="flex flex-col space-y-4">
            {chatLog.map((message, index) => (
              <div
                key={index}
                className={`flex flex-col justify-start`}
                style={{ fontFamily: "'Cerebri Sans', sans-serif", wordWrap: 'break-word' }}
              >
                <div className="flex items-center">
                  <div className={`${message.user === "user" ? "blue" : "gray"} w-8 h-8 rounded-full`}></div>
                  <div className={`chat-role font-bold ${message.user === "user" ? 'none' : 'none'} rounded-lg p-2`}>
                    {message.user}
                  </div>
                  {message.user === "assistant" &&
                    <button
                      className={`show-documents gray rounded-lg ml-auto ${shownSourcesIndex === index ? 'hide-sources' : ''}`}
                      onClick={() => showDocuments(index)}
                    >
                      {shownSourcesIndex === index ? 'hide sources' : 'show sources'}
                    </button>
                  }
                </div>
                <div className={`rounded-lg p-2 text-left pre-wrap`} style={{ alignContent: 'left' }}>
                  {message.user === "user" ? (
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
                <div className={`chat-role gray rounded-lg p-2`}>assistant</div>
                <div className="rounded-lg p-2 text-left pre-wrap" style={{ alignContent: "left" }}>...</div>
              </div>
            )}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex-none p-6 pt-0">
          <div style={{ position: "relative" }}>
            <div className="flex border border-white-700 bg-white-800" style={{ alignItems: "center" }}>
              <textarea
                id="inputArea"
                type="text"
                className="flex-grow px-4 py-2 focus:outline-none"
                disabled={isLoading}
                style={{ fontFamily: "'Cerebri Sans', sans-serif", backgroundColor: "white", borderRadius: "20px", paddingRight: "70px" }}
                rows={inputRows}
                placeholder="Ask a question..."
                value={inputValue}
                onChange={handleTyping}
              />
              <button
                type="submit"
                className="flex absolute right-1 m-auto px-3 py-1 font-semibold focus:outline-none transition-colors duration-300"
                style={{ alignItems: "center", color: 'white', borderRadius: "20px", backgroundColor: "black" }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "gray"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "black"}
                disabled={isLoading}
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
