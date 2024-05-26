import {useState} from "react";

const Sources = ({documents}) => {

    return (
        <div style = {{
            backgroundColor : "#f0f0f0",
            width : "300px",
            padding : "20px",
            overflowY : "auto",
        }}>
            <h1 className = "text-xl" style = {{marginBottom : "20px"}}> Sources </h1>
            {documents.length > 0 ? documents.map ((document, index) => (
                <div key = {index} style = {{marginBottom : "10px"}}> 
                <strong style = {{marginBottom : "10px"}}> {document["title"]} </strong>
                <p> {document["content"]} </p>
                </div>
            )) :
            <strong> No uploaded files were used for this response. </strong>}
        </div>
    )
}

export default Sources;