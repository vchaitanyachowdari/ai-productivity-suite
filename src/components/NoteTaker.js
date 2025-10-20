import React, { useState, useEffect } from 'react';
import { transformNotes, models } from '../api';

const interviewFields = [
  { label: 'Position', value: 'position' },
  { label: 'Interviewer', value: 'interviewer' },
  { label: 'Date', value: 'date' },
  { label: 'Duration', value: 'duration' },
];

const meetingFields = [
  { label: 'Meeting Title', value: 'title' },
  { label: 'Attendees', value: 'attendees' },
  { label: 'Date', value: 'date' },
  { label: 'Duration', value: 'duration' },
];

const interviewUseCases = ['Evaluation Scorecard', 'Slack Update', 'Email Summary', 'Candidate Comparison Matrix', 'Hiring Manager Brief'];
const meetingUseCases = ['Google Doc', 'Slack Update', 'Email Summary', 'Project Plan Outline', 'Meeting Minutes (Formal)'];

const NoteTaker = () => {
  const [noteType, setNoteType] = useState('interview');
  const [context, setContext] = useState({});
  const [rawNotes, setRawNotes] = useState('');
  const [useCase, setUseCase] = useState(interviewUseCases[0]);
  const [transformedNotes, setTransformedNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState(models.gemini[0]);

  useEffect(() => {
    setModel(models[provider][0]);
  }, [provider]);

  const handleNoteTypeChange = (type) => {
    setNoteType(type);
    setContext({});
    setUseCase(type === 'interview' ? interviewUseCases[0] : meetingUseCases[0]);
  };

  const handleContextChange = (e) => {
    setContext({ ...context, [e.target.name]: e.target.value });
  };

  const handleTransform = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const output = await transformNotes({ provider, model, tool: 'notes', noteType, context, rawNotes, useCase });
      setTransformedNotes(output);
    } catch (error) {
      console.error('Transformation failed:', error);
      setError(error.message);
      setTransformedNotes('');
    }
    setIsLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transformedNotes);
  };

  const loadSampleData = () => {
    if (noteType === 'interview') {
      setContext({
        position: 'Software Engineer',
        interviewer: 'Jane Doe',
        date: '2025-10-20',
        duration: '45 minutes',
      });
      setRawNotes(
        `Candidate was confident and articulated answers well. q about data structures - good. q about system design - a bit weak, needed prompting. good team player, mentioned prev exp collaborating on major projects. overall, a strong hire.`
      );
    } else {
      setContext({
        title: 'Q4 Planning',
        attendees: 'John Smith, Sarah Lee, Mike Chen',
        date: '2025-10-20',
        duration: '1 hour',
      });
      setRawNotes(
        `Meeting started on time. JS presented the Q3 results. SL presented the Q4 roadmap. MC raised concerns about resource allocation. Team agreed to follow up on resource planning next week. Overall, productive meeting.`
      );
    }
  };

  const fields = noteType === 'interview' ? interviewFields : meetingFields;
  const useCases = noteType === 'interview' ? interviewUseCases : meetingUseCases;

  return (
    <div className="tool-container">
      <div className="input-column">
        <h2>Raw Note Taker</h2>

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

        <div className="note-type-selector">
          <button
            className={noteType === 'interview' ? 'active' : ''}
            onClick={() => handleNoteTypeChange('interview')}
          >
            Interview Notes
          </button>
          <button
            className={noteType === 'meeting' ? 'active' : ''}
            onClick={() => handleNoteTypeChange('meeting')}
          >
            Meeting Notes
          </button>
        </div>

        <div className="context-fields">
          {fields.map((field) => (
            <div key={field.value} className="field">
              <label>{field.label}</label>
              <input
                type="text"
                name={field.value}
                value={context[field.value] || ''}
                onChange={handleContextChange}
              />
            </div>
          ))}
        </div>

        <div className="raw-notes">
          <label>Raw Notes</label>
          <textarea
            value={rawNotes}
            onChange={(e) => setRawNotes(e.target.value)}
            placeholder="Enter your raw notes here..."
          ></textarea>
        </div>

        <div className="use-case-selector">
          <label>Final Use Case</label>
          <div className="use-case-buttons">
            {useCases.map((uc) => (
              <button
                key={uc}
                className={useCase === uc ? 'active' : ''}
                onClick={() => setUseCase(uc)}
              >
                {uc}
              </button>
            ))}
          </div>
        </div>
        
        <div className="action-buttons">
            <button onClick={handleTransform} disabled={isLoading}>
            {isLoading ? 'Transforming...' : 'Transform Notes'}
            </button>
            <button onClick={loadSampleData}>Load Sample Data</button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="output-column">
        <h2>Formatted Output</h2>
        <div className="output-content">
          <pre>{transformedNotes}</pre>
        </div>
        <button onClick={handleCopy} disabled={!transformedNotes}>
          Copy Output
        </button>
      </div>
    </div>
  );
}

export default NoteTaker;
