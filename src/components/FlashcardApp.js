import React, { useState, useEffect, useCallback } from 'react';
import { transformNotes, models } from '../api';

const Flashcard = ({ card, isFlipped, onClick }) => {
  return (
    <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={onClick}>
      <div className="flashcard-inner">
        <div className="flashcard-front">
          <p>{card.term}</p>
        </div>
        <div className="flashcard-back">
          <p>{card.definition}</p>
        </div>
      </div>
    </div>
  );
};

const FlashcardApp = () => {
  const [topic, setTopic] = useState('');
  const [deck, setDeck] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState(models.gemini[0]);

  useEffect(() => {
    const savedDeck = localStorage.getItem('flashcardDeck');
    if (savedDeck) {
      setDeck(JSON.parse(savedDeck));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('flashcardDeck', JSON.stringify(deck));
  }, [deck]);

  const handleGenerate = async () => {
    setError(null);
    setIsLoading(true);
    setDeck([]);
    try {
      const output = await transformNotes({
        provider,
        model,
        tool: 'flashcards',
        topic,
      });
      const parsedDeck = JSON.parse(output).map(card => ({ ...card, srsLevel: 0, lastReviewed: null }));
      setDeck(parsedDeck);
      setCurrentIndex(0);
      setFlipped(false);
    } catch (error) {
      console.error('Generation failed:', error);
      setError(`Failed to generate or parse flashcards. ${error.message}`);
    }
    setIsLoading(false);
  };

  const handleNext = useCallback(() => {
    setFlipped(false);
    setCurrentIndex((prevIndex) => (prevIndex + 1) % deck.length);
  }, [deck.length]);

  const handlePrev = () => {
    setFlipped(false);
    setCurrentIndex((prevIndex) => (prevIndex - 1 + deck.length) % deck.length);
  };

  const handleShuffle = () => {
    setDeck((prevDeck) => [...prevDeck].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setFlipped(false);
  };

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const handleSRSReview = (feedback) => {
    if (deck.length === 0) return;

    const updatedDeck = [...deck];
    const currentCard = { ...updatedDeck[currentIndex] };

    if (feedback === 'easy') {
      currentCard.srsLevel = Math.min(currentCard.srsLevel + 1, 3); // Max level 3
    } else if (feedback === 'good') {
      currentCard.srsLevel = Math.min(currentCard.srsLevel + 0, 3); // Stay at same level
    } else if (feedback === 'hard') {
      currentCard.srsLevel = Math.max(currentCard.srsLevel - 1, 0); // Min level 0
    }
    currentCard.lastReviewed = new Date().toISOString();
    updatedDeck[currentIndex] = currentCard;
    setDeck(updatedDeck);
    handleNext(); // Move to next card after review
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (deck.length === 0) return;
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') {
        e.preventDefault(); // Prevent page scroll
        handleFlip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deck, handleNext]);

  return (
    <div className="tool-container flashcard-app">
        <div className="flashcard-input-area">
            <h2>Flashcard Generator</h2>
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
                <label>Enter a topic to generate flashcards</label>
                <input 
                    type="text" 
                    value={topic} 
                    onChange={(e) => setTopic(e.target.value)} 
                    placeholder="e.g., The Solar System, React Hooks, World War II"
                />
            </div>
            <button onClick={handleGenerate} disabled={isLoading || !topic} className="generate-btn">
                {isLoading ? 'Generating...' : 'Generate Flashcards'}
            </button>
            {error && <div className="error-message">{error}</div>}
        </div>

        <div className="flashcard-display-area">
            {deck.length > 0 ? (
            <>
                <Flashcard card={deck[currentIndex]} isFlipped={flipped} onClick={handleFlip} />
                <div className="flashcard-nav">
                    <button onClick={handlePrev}>Previous</button>
                    <span>{currentIndex + 1} / {deck.length}</span>
                    <button onClick={handleNext}>Next</button>
                </div>
                <div className="srs-feedback-buttons">
                    <button onClick={() => handleSRSReview('hard')} className="srs-hard">Hard</button>
                    <button onClick={() => handleSRSReview('good')} className="srs-good">Good</button>
                    <button onClick={() => handleSRSReview('easy')} className="srs-easy">Easy</button>
                </div>
                <button onClick={handleShuffle} className="shuffle-btn">Shuffle Deck</button>
            </>
            ) : (
            <div className="flashcard-placeholder">
                <p>Your generated flashcards will appear here.</p>
            </div>
            )}
        </div>
    </div>
  );
};

export default FlashcardApp;

