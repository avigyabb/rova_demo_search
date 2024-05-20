import React, {useEffect, useState} from "react";
import axios from 'axios';
import "../Styles/Chat.css";

export default function Chat() {
    const [inputValue, setInputValue] = useState("");
    let [chatLog, setChatLog] = useState([]);

    const [chat, setChat] = useState([]);

    const handleReset = async () => {
        try {
            const response = await fetch('https://amboralabsservice.com/reset-chat/', {method: 'DELETE'});
            setChatLog([]);
        } catch (error) {
            console.error('Error resetting chat:', error);
        }
    };

    useEffect(() => {
        const fetchChat = async () => {
          try {
            const response = await fetch('https://amboralabsservice.com/chat-history/');
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
                const params = {
                    message : inputValue
                }
                const response = await axios.post("https://amboralabsservice.com/send-message/", {
                    method: 'POST',
                    body: inputValue,
                })
                const assistantChat = {user : "assistant", message : response.data.response}
                setChatLog(prevChatLog => [...prevChatLog, assistantChat])
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

    return (
        <div className = "container mx-auto">
            <div className = "flex flex-col h-screen bg-gray-900" style = {{maxHeight: "100vh", backgroundColor: "#e9e9e9"}}>
                 <div className="flex justify-end p-4">
                    <button
                        className="rounded-lg px-4 py-2 font-semibold focus:outline-none hover:bg-purple-600 transition-colors duration-300"
                        onClick={handleReset}
                        style={{ background: "#fd7013", color: "white" }}
                    >
                        Reset Chat
                    </button>
                </div>
                <div className = "flex-grow p-6" style = {{overflowY: "auto"}}>
                    <div className = "flex flex-col space-y-4">
                        {
                            chatLog.map((message, index) => (
                                <div
                                    key = {index}
                                    className = {`flex flex-col justify-start`}
                                    style = {{fontFamily: "'Cerebri Sans', sans-serif", wordWrap: 'break-word'}}
                                >
                                    <div className={`chat ${message.user === "user" ? 'blue' : 'gray'} rounded-lg p-2`}>
                                        {message.user}
                                    </div>
                                    <div className = {`rounded-lg p-2 text-left`} style={{alignContent: 'left'}}>
                                        <div dangerouslySetInnerHTML={{ __html: formatGPTMessage(message.message) }} />
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>
                <form onSubmit = {handleSubmit} className = "flex-none p-6">
                    <div style = {{position : "relative"}}>
                        <div className = "flex rounded-lg border border-white-700 bg-white-800">
                            <input type = "text" className = "flex-grow px-4 py-2 focus:outline-none" style = {{backgroundColor : "white", color : "gray", borderRadius : "8px", paddingRight : "40px"}} placeholder = "" value = {inputValue} onChange = {(e) => setInputValue(e.target.value)} />
                            <button
                            type = "submit"
                            className = "absolute right-0 top-0 bottom-0 m-auto rounded-lg px-4 py-2 font-semibold focus:outline-none hover:bg-purple-600 transition-colors duration-300"
                            style = {{background : "transparent"}}
                            onMouseEnter={(e) => e.target.style.color = "#fd7013"}
                            onMouseLeave = {(e) => e.target.style.color = "black"}>
                            Send
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}