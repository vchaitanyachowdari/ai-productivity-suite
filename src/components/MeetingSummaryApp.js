import React, { useState, useEffect } from 'react';
import { transformNotes, models } from '../api';

const MeetingSummaryApp = () => {
  const [rawNotes, setRawNotes] = useState('');
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState(models.gemini[0]);

  useEffect(() => {
    setModel(models[provider][0]);
  }, [provider]);

  const handleSummarize = async () => {
    setError(null);
    setIsLoading(true);
    setSummary('');
    try {
      const output = await transformNotes({
        provider,
        model,
        tool: 'meeting_summary',
        rawNotes,
      });
      setSummary(output);
    } catch (error) {
      console.error('Summarization failed:', error);
      setError(`Failed to generate summary. ${error.message}`);
    }
    setIsLoading(false);
  };

  return (
    <div className="tool-container meeting-summary-app">
      <div className="input-column">
        <h2>Meeting Notes Summary</h2>

        <div className="model-selector-container">
          <div className="field">
            <label>Provider</label>
            <select value={provider} onChange={(e) => setProvider(e.target.value)}>
              {Object.keys(models).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              {models[provider].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Paste Raw Meeting Notes/Transcripts</label>
          <textarea
            value={rawNotes}
            onChange={(e) => setRawNotes(e.target.value)}
            placeholder="Paste your meeting notes or transcript here..."
          ></textarea>
        </div>

        <div className="action-buttons">
          <button onClick={handleSummarize} disabled={isLoading || !rawNotes}>
            {isLoading ? 'Summarizing...' : 'Summarize'}
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="output-column">
        <h2>Summary</h2>
        <div className="output-content">
          <pre>{summary}</pre>
        </div>
      </div>
    </div>
  );
};

export default MeetingSummaryApp;
