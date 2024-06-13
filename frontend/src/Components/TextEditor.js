// TextEditor.js
import React, { useState } from 'react';
import QuestionCell from './QuestionCell';
import "../Styles/TextEditor.css";

const TextEditor = () => {
  const [questionCells, setQuestionCells] = useState([]);

  const addQuestionCell = () => {
    setQuestionCells([...questionCells, { id: Date.now() }]);
  };

  const deleteQuestionCell = (id) => {
    setQuestionCells(questionCells.filter((cell) => cell.id !== id));
  };

  return (
    <div className="text-editor">
      <button onClick={addQuestionCell}>Add Question</button>
      {questionCells.map((cell) => (
        <QuestionCell key={cell.id} id={cell.id} onDelete={deleteQuestionCell} />
      ))}
    </div>
  );
};

export default TextEditor;
