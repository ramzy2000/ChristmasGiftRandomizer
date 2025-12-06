import { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { ParticipantMatch } from '../types';
import './ParticipantView.css';

function ParticipantView() {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const name = searchParams.get('name') || '';
  
  const [exchange, setExchange] = useState<{ id: string; name: string; status: string } | null>(null);
  const [match, setMatch] = useState<ParticipantMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState(name);

  useEffect(() => {
    if (code) {
      loadExchange();
      if (name) {
        loadMatch();
      }
    }
  }, [code, name]);

  const loadExchange = async () => {
    if (!code) return;
    try {
      const data = await api.getExchangeByParticipantCode(code);
      setExchange(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Exchange not found');
    }
  };

  const loadMatch = async () => {
    if (!code || !participantName.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await api.getParticipantMatch(code.toUpperCase(), participantName.trim());
      setMatch(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load match');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadMatch();
  };

  if (!exchange && !error) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (error && !exchange) {
    return (
      <div className="container">
        <div className="card">
          <div className="alert alert-error">{error}</div>
          <Link to="/" className="btn btn-primary">Go Home</Link>
        </div>
      </div>
    );
  }

  if (!exchange) return null;

  return (
    <div className="participant-view">
      <div className="container">
        <div className="card">
          <h1>{exchange.name}</h1>
          
          {exchange.status !== 'matched' && (
            <div className="alert alert-info">
              <p>The exchange has not been matched yet. Please check back later!</p>
              <Link to="/" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
                Go Home
              </Link>
            </div>
          )}

          {exchange.status === 'matched' && !match && (
            <div className="match-form-section">
              <h2>Enter Your Name</h2>
              <p>Enter your name to see who you're matched with</p>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="participantName">Your Name</label>
                  <input
                    id="participantName"
                    type="text"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    disabled={loading}
                  />
                </div>
                {error && <div className="alert alert-error">{error}</div>}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading || !participantName.trim()}
                >
                  {loading ? 'Loading...' : 'View Match'}
                </button>
              </form>
            </div>
          )}

          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading your match...</p>
            </div>
          )}

          {match && !loading && (
            <div className="match-result">
              <div className="match-card">
                <h2>🎁 Your Match</h2>
                <div className="match-content">
                  <p className="match-label">You are giving a gift to:</p>
                  <p className="match-name">{match.matchedWithName}</p>
                </div>
              </div>
              <div className="match-info">
                <p>Keep this a secret until gift exchange day!</p>
              </div>
              <Link to="/" className="btn btn-secondary">Create New Exchange</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ParticipantView;

