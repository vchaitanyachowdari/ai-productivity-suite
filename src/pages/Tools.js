import React from 'react';
import { Link } from 'react-router-dom';

function Tools() {
  const toolList = [
    { name: "Note Taker", description: "Capture and organize your thoughts with AI-powered note-taking.", path: "/tools/note-taker" },
    { name: "Email Enhancer", description: "Improve your email writing with AI suggestions for tone, grammar, and clarity.", path: "/tools/email-enhancer" },
    { name: "Flashcards", description: "Create and study flashcards efficiently using AI to generate questions and answers.", path: "/tools/flashcards" },
    { name: "Brainstorming", description: "Generate creative ideas and solutions with AI-assisted brainstorming sessions.", path: "/tools/brainstorming" },
    { name: "Meeting Summary", description: "Get concise summaries of your meetings, highlighting key decisions and action items.", path: "/tools/meeting-summary" },
    { name: "CSV Visualizer", description: "Transform your CSV data into insightful visualizations and charts.", path: "/tools/csv-visualizer" },
    { name: "PDF Analyzer", description: "Extract key information, summarize, and analyze content from PDF documents.", path: "/tools/pdf-analyzer" },
  ];

  return (
    <div>
      <h1>Our AI Tools</h1>
      <ul>
        {toolList.map((tool, index) => (
          <li key={index}>
            <h3>
              {tool.path ? <Link to={tool.path}>{tool.name}</Link> : tool.name}
            </h3>
            <p>{tool.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
  }

export default Tools;