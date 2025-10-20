import React, { useState, useEffect } from 'react';
import { transformNotes, models } from '../api';

const tones = ['Concise', 'Warm', 'Formal', 'Friendly', 'Persuasive'];

const EmailEnhancer = () => {
  const [rawText, setRawText] = useState('');
  const [emailToReply, setEmailToReply] = useState('');
  const [tone, setTone] = useState(tones[0]);
  const [transformedEmail, setTransformedEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState(models.gemini[0]);

  useEffect(() => {
    setModel(models[provider][0]);
  }, [provider]);

  const handleTransform = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const output = await transformNotes({
        provider,
        model,
        tool: 'email',
        rawText,
        emailToReply,
        tone,
      });
      setTransformedEmail(output);
    } catch (error) {
      console.error('Transformation failed:', error);
      setError(error.message);
      setTransformedEmail('');
    }
    setIsLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(transformedEmail);
  };

  return (
    <div className="tool-container email-enhancer">
      <div className="input-column">
        <h2>Email Enhancer</h2>

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

        <div className="raw-notes">
          <label>What are you trying to say?</label>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="e.g., I can't make the meeting on Friday, let's reschedule."
          ></textarea>
        </div>

        <div className="raw-notes">
          <label>Email you are responding to (optional)</label>
          <textarea
            value={emailToReply}
            onChange={(e) => setEmailToReply(e.target.value)}
            placeholder="Paste the original email here..."
          ></textarea>
        </div>

        <div className="use-case-selector">
          <label>Choose a Tone</label>
          <div className="use-case-buttons">
            {tones.map((t) => (
              <button
                key={t}
                className={tone === t ? 'active' : ''}
                onClick={() => setTone(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="action-buttons">
            <button onClick={handleTransform} disabled={isLoading}>
            {isLoading ? 'Generating...' : 'Generate Email'}
            </button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="output-column">
        <h2>Generated Email</h2>
        <div className="output-content">
          <pre>{transformedEmail}</pre>
        </div>
        <button onClick={handleCopy} disabled={!transformedEmail}>
          Copy Email
        </button>
      </div>
    </div>
  );
};

export default EmailEnhancer;
