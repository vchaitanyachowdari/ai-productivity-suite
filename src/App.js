import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Tools from './pages/Tools';
import NoteTaker from './components/NoteTaker';
import EmailEnhancer from './components/EmailEnhancer';
import FlashcardApp from './components/FlashcardApp';
import BrainstormingApp from './components/BrainstormingApp';
import MeetingSummaryApp from './components/MeetingSummaryApp';
import CsvVisualizerApp from './components/CsvVisualizerApp';
import PdfAnalyzerApp from './components/PdfAnalyzerApp'; // Import PdfAnalyzerApp
import './App.css';

function App() {
  return (
    <div className="App">
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/tools">Tools</Link>
          </li>
        </ul>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/tools/note-taker" element={<NoteTaker />} />
        <Route path="/tools/email-enhancer" element={<EmailEnhancer />} />
        <Route path="/tools/flashcards" element={<FlashcardApp />} />
        <Route path="/tools/brainstorming" element={<BrainstormingApp />} />
        <Route path="/tools/meeting-summary" element={<MeetingSummaryApp />} />
        <Route path="/tools/csv-visualizer" element={<CsvVisualizerApp />} />
        <Route path="/tools/pdf-analyzer" element={<PdfAnalyzerApp />} /> {/* New Route for PDF Analyzer */}
      </Routes>
    </div>
  );
}

export default App;
