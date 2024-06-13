import React, { useState, useEffect, useRef } from 'react';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { schema } from 'prosemirror-schema-basic';
import { exampleSetup } from 'prosemirror-example-setup';
import 'prosemirror-view/style/prosemirror.css';
import 'prosemirror-menu/style/menu.css';
import "../Styles/QuestionCell.css";

const QuestionCell = ({ id, onDelete }) => {
  const [question, setQuestion] = useState('');
  const editorRef = useRef(null);
  const editorViewRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && !editorViewRef.current) {
      const editorState = EditorState.create({
        doc: schema.node('doc', null, schema.node('paragraph')),
        plugins: exampleSetup({ schema }),
      });

      editorViewRef.current = new EditorView(editorRef.current, {
        state: editorState,
      });
    }

    return () => {
      if (editorViewRef.current) {
        editorViewRef.current.destroy();
        editorViewRef.current = null;
      }
    };
  }, []);

  return (
    <div className="question-cell">
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Enter your question"
      />
      <div ref={editorRef} className="ProseMirror-editor" />
      <button onClick={() => onDelete(id)}>Delete</button>
    </div>
  );
};

export default QuestionCell;
