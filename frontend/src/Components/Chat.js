import React, {useEffect, useState} from "react";
import axios from 'axios';
import "../Styles/Chat.css";
import { REACT_APP_API_URL } from "../consts";

export default function Chat() {
    const [inputValue, setInputValue] = useState("");
    let [chatLog, setChatLog] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleReset = async () => {
        try {
            const response = await fetch(REACT_APP_API_URL + 'reset-chat/', {method: 'DELETE'});
            setChatLog([]);
        } catch (error) {
            console.error('Error resetting chat:', error);
        }
    };

    useEffect(() => {
        const fetchChat = async () => {
          try {
            const response = await fetch(REACT_APP_API_URL + 'chat-history/');
            const result = await response.json();
            setChatLog(result);
          } catch (error) {
            console.error('Error fetching chat:', error);
          }
        };
        fetchChat();
      }, []);
 
    const handleSubmit = (event) => {
        console.log("ran")
        event.preventDefault()
        const sendMessage = async() => {
            try {
                const userChat = {user : "user", message : inputValue}
                setChatLog(prevChatLog => [...prevChatLog, userChat])
                setIsLoading(true)
                const chatWindowDiv = document.getElementById("chatWindowDiv")
                if (chatWindowDiv) {
                    const height = chatWindowDiv.scrollHeight
                    chatWindowDiv.scrollTop = height
                }
                const params = {
                    message : inputValue
                }
                const response = await axios.post(REACT_APP_API_URL + "send-message/", {
                    method: 'POST',
                    body: inputValue,
                })
                const assistantChat = {user : "assistant", message : response.data.response}
                setChatLog(prevChatLog => [...prevChatLog, assistantChat])
                setIsLoading(false)
                chatWindowDiv = document.getElementById("chatWindowDiv")
                if (chatWindowDiv) {
                    const height = chatWindowDiv.scrollHeight
                    chatWindowDiv.scrollTop = height
                }
            } catch (error) {
                console.error(error)
            }
        }
        sendMessage()
        setInputValue("")
    };

    function formatGPTMessage(message) {
        if (typeof message !== 'string') {
            return '';
        }
    
        // Replace **bold** with <strong>bold</strong>
        const boldFormattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
        // Replace newlines with <br>
        const newlineFormattedMessage = boldFormattedMessage.replace(/\n/g, '<br>');
    
        return newlineFormattedMessage;
    }

    const handleTyping = (event) => {
        setInputValue(event.target.value);
    }

    return (
        <div className = "container mx-auto">
            <div className = "flex flex-col h-screen bg-gray-900" style = {{maxHeight: "100vh", backgroundColor: "#e9e9e9"}}>
                 <div className="flex justify-end pt-4 pr-4">
                    <button
                        className="rounded-lg px-4 py-2 font-semibold focus:outline-none hover:bg-purple-600 transition-colors duration-300"
                        onClick={handleReset}
                        style={{ background: "#fd7013", color: "white" }}
                    >
                        Reset Chat
                    </button>
                </div>
                <div id = "chatWindowDiv" className = "flex-grow p-6" style = {{overflowY: "auto"}}>
                    <div className = "flex flex-col space-y-4">
                        {
                            chatLog.map((message, index) => (
                                <div
                                    key = {index}
                                    className = {`flex flex-col justify-start`}
                                    style = {{fontFamily: "'Cerebri Sans', sans-serif", wordWrap: 'break-word'}}
                                >
                                    <div className={`chat-role ${message.user === "user" ? 'blue' : 'gray'} rounded-lg p-2`}>
                                        {message.user}
                                    </div>
                                    <div className = {`rounded-lg p-2 text-left`} style={{alignContent: 'left'}}>
                                        <div dangerouslySetInnerHTML={{ __html: formatGPTMessage(message.message) }} />
                                    </div>
                                </div>
                            )
                        )}
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
                <form onSubmit = {handleSubmit} className = "flex-none p-6">
                    <div style = {{position : "relative"}}>
                        <div className = "flex rounded-lg border border-white-700 bg-white-800">
                            <textarea type = "text" className = "flex-grow px-4 py-2 focus:outline-none" disabled = {isLoading} style = {{backgroundColor : "white", color : "gray", borderRadius : "8px", paddingRight : "70px"}} placeholder = "" value = {inputValue} onChange = {handleTyping} />
                            <button
                            type = "submit"
                            className = "absolute right-0 top-0 bottom-0 m-auto rounded-lg px-4 py-2 font-semibold focus:outline-none hover:bg-purple-600 transition-colors duration-300"
                            style = {{background : "transparent"}}
                            onMouseEnter={(e) => e.target.style.color = "lightblue"}
                            onMouseLeave = {(e) => e.target.style.color = "black"}
                            disabled = {isLoading}>
                            Send
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}