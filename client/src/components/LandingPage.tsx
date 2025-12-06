import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { validateExchangeName } from '../utils/validation';
import './LandingPage.css';

function LandingPage() {
  const [exchangeName, setExchangeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCreateExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validation = validateExchangeName(exchangeName);
    if (!validation.valid) {
      setError(validation.error || 'Invalid exchange name');
      return;
    }

    setLoading(true);
    try {
      const exchange = await api.createExchange({ name: exchangeName });
      navigate(`/organizer/${exchange.organizerToken}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exchange');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-page">
      <div className="container">
        <div className="card">
          <h1>🎁 Christmas Gift Exchange</h1>
          <p className="subtitle">Create and manage your secret gift exchange</p>

          <form onSubmit={handleCreateExchange} className="create-form">
            <div className="form-group">
              <label htmlFor="exchangeName">Exchange Name</label>
              <input
                id="exchangeName"
                type="text"
                value={exchangeName}
                onChange={(e) => setExchangeName(e.target.value)}
                placeholder="e.g., Smith Family 2024"
                disabled={loading}
                required
              />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !exchangeName.trim()}
            >
              {loading ? 'Creating...' : 'Create Exchange'}
            </button>
          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="organizer-section">
            <h2>Access Your Exchange</h2>
            <p>Enter your organizer token to manage your exchange</p>
            <OrganizerTokenInput />
          </div>

          <div className="divider">
            <span>OR</span>
          </div>

          <div className="participant-section">
            <h2>View Your Match</h2>
            <p>Enter your participant code to see who you're matched with</p>
            <ParticipantCodeInput />
          </div>
        </div>
      </div>
    </div>
  );
}

function OrganizerTokenInput() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleAccessExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError('Please enter your organizer token');
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token.trim())) {
      setError('Invalid token format. Please check your organizer token.');
      return;
    }

    setLoading(true);
    try {
      // Verify the token is valid by checking if exchange exists
      await api.getExchangeByOrganizerToken(token.trim());
      navigate(`/organizer/${token.trim()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid organizer token. Please check and try again.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAccessExchange} className="organizer-form">
      <div className="form-group">
        <label htmlFor="organizerToken">Organizer Token</label>
        <input
          id="organizerToken"
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value.trim())}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          disabled={loading}
          required
        />
        <small>Enter the organizer token you received when creating the exchange</small>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading || !token.trim()}
      >
        {loading ? 'Loading...' : 'Access Exchange'}
      </button>
    </form>
  );
}

function ParticipantCodeInput() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleViewMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim() || !name.trim()) {
      setError('Please enter both code and name');
      return;
    }

    setLoading(true);
    try {
      navigate(`/participant/${code.toUpperCase()}?name=${encodeURIComponent(name)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load match');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleViewMatch} className="participant-form">
      <div className="form-group">
        <label htmlFor="code">Participant Code</label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={6}
          disabled={loading}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="name">Your Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          disabled={loading}
          required
        />
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading || !code.trim() || !name.trim()}
      >
        {loading ? 'Loading...' : 'View Match'}
      </button>
    </form>
  );
}

export default LandingPage;

