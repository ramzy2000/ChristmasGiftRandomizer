import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './components/LandingPage';
import OrganizerDashboard from './components/OrganizerDashboard';
import ParticipantView from './components/ParticipantView';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/organizer/:token" element={<OrganizerDashboard />} />
          <Route path="/participant/:code" element={<ParticipantView />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
