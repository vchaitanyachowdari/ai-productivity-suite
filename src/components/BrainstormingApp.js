import React, { useState, useEffect } from 'react';
import { transformNotes, models } from '../api';

const sessionTypes = ['Product Development', 'Marketing Campaign', 'Feature Brainstorm', 'Problem Solving', 'Strategy Planning'];
const levels = ['Low', 'Medium', 'High'];

const IdeaCard = ({ idea }) => {
  return (
    <div className="idea-card">
      <h3>{idea.title}</h3>
      <p>{idea.description}</p>
      <div className="idea-meta">
        <span>Priority: <span className={`level-${idea.priority.toLowerCase()}`}>{idea.priority}</span></span>
        <span>Effort: <span className={`level-${idea.effort.toLowerCase()}`}>{idea.effort}</span></span>
        <span>Impact: <span className={`level-${idea.impact.toLowerCase()}`}>{idea.impact}</span></span>
      </div>
    </div>
  );
};

const BrainstormingApp = () => {
  const [companyName, setCompanyName] = useState('');
  const [product, setProduct] = useState('');
  const [timeline, setTimeline] = useState('');
  const [teamGoals, setTeamGoals] = useState('');
  const [sessionType, setSessionType] = useState(sessionTypes[0]);
  const [understandingSummary, setUnderstandingSummary] = useState('');
  const [ideas, setIdeas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState(models.gemini[0]);

  useEffect(() => {
    setModel(models[provider][0]);
  }, [provider]);

  const handleGenerateIdeas = async () => {
    setError(null);
    setIsLoading(true);
    setUnderstandingSummary('');
    setIdeas([]);
    try {
      const output = await transformNotes({
        provider,
        model,
        tool: 'brainstorming',
        companyName,
        product,
        timeline,
        teamGoals,
        sessionType,
      });
      const parsedOutput = JSON.parse(output);
      setUnderstandingSummary(parsedOutput.summary);
      setIdeas(parsedOutput.ideas);
    } catch (error) {
      console.error('Idea generation failed:', error);
      setError(`Failed to generate ideas. ${error.message}`);
    }
    setIsLoading(false);
  };

  return (
    <div className="tool-container brainstorming-app">
      <div className="input-column">
        <h2>AI Brainstorming Tool</h2>

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

        <div className="context-inputs">
          <div className="field">
            <label>Company Name</label>
            <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g., InnovateCorp" />
          </div>
          <div className="field">
            <label>Product</label>
            <input type="text" value={product} onChange={(e) => setProduct(e.target.value)} placeholder="e.g., Quantum Leap CRM" />
          </div>
          <div className="field">
            <label>Timeline</label>
            <input type="text" value={timeline} onChange={(e) => setTimeline(e.target.value)} placeholder="e.g., Next 3 months" />
          </div>
          <div className="field">
            <label>Team Goals</label>
            <textarea value={teamGoals} onChange={(e) => setTeamGoals(e.target.value)} placeholder="e.g., Increase user engagement by 20% and streamline onboarding."></textarea>
          </div>
          <div className="field">
            <label>Session Type</label>
            <select value={sessionType} onChange={(e) => setSessionType(e.target.value)}>
              {sessionTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={handleGenerateIdeas} disabled={isLoading || !companyName || !product || !teamGoals}>
            {isLoading ? 'Generating Ideas...' : 'Generate Ideas'}
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="output-column brainstorming-output">
        <h2>Generated Ideas</h2>
        {understandingSummary && (
          <div className="summary-card">
            <h3>AI's Understanding of Your Context:</h3>
            <p>{understandingSummary}</p>
          </div>
        )}
        <div className="ideas-grid">
          {ideas.length > 0 ? (
            ideas.map((idea, index) => <IdeaCard key={index} idea={idea} />)
          ) : (
            !isLoading && <p className="placeholder-text">Enter your context and generate ideas!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BrainstormingApp;
