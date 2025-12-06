import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import type { Exchange } from '../types';
import './OrganizerDashboard.css';

function OrganizerDashboard() {
  const { token } = useParams<{ token: string }>();
  const [exchange, setExchange] = useState<Exchange | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState('');
  const [excludedNames, setExcludedNames] = useState('');
  const [addingParticipant, setAddingParticipant] = useState(false);
  const [generatingMatches, setGeneratingMatches] = useState(false);

  useEffect(() => {
    if (token) {
      loadExchange();
    }
  }, [token]);

  const loadExchange = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getExchangeByOrganizerToken(token);
      setExchange(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exchange');
    } finally {
      setLoading(false);
    }
  };


  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !participantName.trim()) return;

    setAddingParticipant(true);
    setError(null);
    try {
      const excluded = excludedNames
        .split(',')
        .map(n => n.trim())
        .filter(n => n.length > 0);

      await api.addParticipant(token, {
        name: participantName.trim(),
        excludedNames: excluded,
      });

      setParticipantName('');
      setExcludedNames('');
      await loadExchange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add participant');
    } finally {
      setAddingParticipant(false);
    }
  };

  const handleGenerateMatches = async () => {
    if (!token) return;

    if (!window.confirm('Are you sure you want to generate matches? This cannot be undone.')) {
      return;
    }

    setGeneratingMatches(true);
    setError(null);
    try {
      const result = await api.generateMatches(token);
      if (result.success) {
        // Reload exchange to get updated status and matches
        await loadExchange();
      } else {
        setError(result.error || 'Failed to generate matches');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate matches');
    } finally {
      setGeneratingMatches(false);
    }
  };

  const handleDeleteParticipant = async (participantId: string) => {
    if (!token) return;

    if (!window.confirm('Are you sure you want to remove this participant?')) {
      return;
    }

    try {
      await api.deleteParticipant(token, participantId);
      await loadExchange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete participant');
    }
  };

  const copyToClipboard = (text: string | undefined) => {
    if (!text) {
      console.error('Cannot copy: text is undefined');
      alert('Error: Cannot copy. Please refresh the page.');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    }).catch((err) => {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading exchange...</p>
        </div>
      </div>
    );
  }

  if (error && !exchange) {
    return (
      <div className="container">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!exchange) return null;

  const canGenerateMatches = exchange.participants.length >= 2 && exchange.status !== 'matched';

  return (
    <div className="organizer-dashboard">
      <div className="container">
        <div className="card">
          <h1>{exchange.name}</h1>
          <p className="status">Status: <strong>{exchange.status}</strong></p>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Share Section */}
          <div className="share-section">
            <h2>Share Codes</h2>
            <div className="code-group">
              <div>
                <label>Organizer Token (Keep Secret!)</label>
                <div className="code-display" onClick={() => copyToClipboard(exchange.organizerToken)}>
                  {exchange.organizerToken}
                </div>
                <small>Click to copy - Use this to manage the exchange</small>
              </div>
              <div>
                <label>Participant Code (Share This)</label>
                <div className="code-display" onClick={() => copyToClipboard(exchange.participantCode)}>
                  {exchange.participantCode}
                </div>
                <small>Click to copy - Share this with participants</small>
              </div>
            </div>
          </div>

          {/* Add Participant Form */}
          {exchange.status !== 'matched' && (
            <div className="add-participant-section">
              <h2>Add Participant</h2>
              <form onSubmit={handleAddParticipant}>
                <div className="form-group">
                  <label htmlFor="participantName">Name</label>
                  <input
                    id="participantName"
                    type="text"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    placeholder="Enter participant name"
                    required
                    disabled={addingParticipant}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="excludedNames">Excluded Names (Optional)</label>
                  <input
                    id="excludedNames"
                    type="text"
                    value={excludedNames}
                    onChange={(e) => setExcludedNames(e.target.value)}
                    placeholder="Comma-separated: John, Jane"
                    disabled={addingParticipant}
                  />
                  <small>Names this person cannot be matched with</small>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addingParticipant || !participantName.trim()}
                >
                  {addingParticipant ? 'Adding...' : 'Add Participant'}
                </button>
              </form>
            </div>
          )}

          {/* Participants List */}
          <div className="participants-section">
            <h2>Participants ({exchange.participants.length})</h2>
            {exchange.participants.length === 0 ? (
              <p className="empty-state">No participants yet. Add some above!</p>
            ) : (
              <ul className="participant-list">
                {exchange.participants.map((participant) => (
                  <li key={participant.id} className="participant-item">
                    <div>
                      <strong>{participant.name}</strong>
                      {participant.excludedNames.length > 0 && (
                        <div className="excluded-names">
                          Excludes: {participant.excludedNames.join(', ')}
                        </div>
                      )}
                    </div>
                    {exchange.status !== 'matched' && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteParticipant(participant.id)}
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Generate Matches */}
          {canGenerateMatches && (
            <div className="generate-section">
              <button
                className="btn btn-primary btn-large"
                onClick={handleGenerateMatches}
                disabled={generatingMatches}
              >
                {generatingMatches ? 'Generating Matches...' : 'Generate Matches'}
              </button>
              <p className="info-text">
                Once you generate matches, participants can view their match using the participant code.
              </p>
            </div>
          )}

          {/* Matches Display */}
          {exchange.status === 'matched' && (
            <div className="matches-section">
              <h2>Matches</h2>
              {exchange.participants.some(p => p.matchedWith) ? (
                <table className="matches-table">
                  <thead>
                    <tr>
                      <th>Giver</th>
                      <th>Receiver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exchange.participants.map((participant) => {
                      if (!participant.matchedWith) return null;
                      const receiver = exchange.participants.find(
                        p => p.id === participant.matchedWith
                      );
                      return receiver ? (
                        <tr key={participant.id}>
                          <td>{participant.name}</td>
                          <td>{receiver.name}</td>
                        </tr>
                      ) : null;
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="empty-state">No matches found. Please try generating matches again.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrganizerDashboard;

