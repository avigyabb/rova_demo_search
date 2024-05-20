import React, {useEffect, useState} from "react";
import axios from 'axios';
import "../Styles/Chat.css";

export default function Chat() {
    const [inputValue, setInputValue] = useState("");
    let [chatLog, setChatLog] = useState([]);

    const handleSubmit = (event) => {
        event.preventDefault()
        const sendMessage = async() => {
            try {
                const userChat = {type : "user", message : inputValue}
                setChatLog(prevChatLog => [...prevChatLog, userChat])
                const params = {
                    message : inputValue
                }
                const response = await axios.post("http://127.0.0.1:8000/send-message/", {
                    method: 'POST',
                    body: inputValue,
                })
                const assistantChat = {type : "assistant", message : response.data.response}
                setChatLog(prevChatLog => [...prevChatLog, assistantChat])
            } catch (error) {
                console.error(error)
            }
        }
        sendMessage()
        setInputValue("")
    };

    return (
        <div className = "container mx-auto">
            <div className = "flex flex-col h-screen bg-gray-900" style = {{maxHeight: "100vh", backgroundColor: "#e9e9e9"}}>
                <div className = "flex-grow p-6" style = {{overflowY: "auto"}}>
                    <div className = "flex flex-col space-y-4">
                        {
                            chatLog.map((message, index) => (
                                <div
                                    key = {index}
                                    className = {`flex flex-col justify-start`}
                                    style = {{fontFamily: "'Cerebri Sans', sans-serif", wordWrap: 'break-word'}}
                                >
                                    <div className={`chat ${message.type === "user" ? 'blue' : 'gray'} rounded-lg p-2`}>
                                        {message.type}
                                    </div>
                                    <div className = {`rounded-lg p-2`}>
                                        {message.message}
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