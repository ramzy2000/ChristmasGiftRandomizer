import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LandingPage from './LandingPage';
import { api } from '../services/api';

// Mock the API
vi.mock('../services/api', () => ({
  api: {
    createExchange: vi.fn(),
    getExchangeByOrganizerToken: vi.fn(),
  }
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the landing page', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Christmas Gift Exchange/i)).toBeInTheDocument();
    expect(screen.getByText(/Create and manage your secret gift exchange/i)).toBeInTheDocument();
  });

  it('should render exchange creation form', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/Exchange Name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Exchange/i })).toBeInTheDocument();
  });

  it('should render participant code input form', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/Participant Code/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View Match/i })).toBeInTheDocument();
  });

  it('should create exchange on form submit', async () => {
    const user = userEvent.setup();
    const mockExchange = {
      id: 'test-id',
      name: 'Test Exchange',
      organizerToken: 'test-token',
      participantCode: 'TEST12',
      status: 'draft',
      createdAt: new Date().toISOString()
    };

    vi.mocked(api.createExchange).mockResolvedValue(mockExchange);

    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    const input = screen.getByLabelText(/Exchange Name/i);
    const submitButton = screen.getByRole('button', { name: /Create Exchange/i });

    await user.type(input, 'Test Exchange');
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.createExchange).toHaveBeenCalledWith({ name: 'Test Exchange' });
      expect(mockNavigate).toHaveBeenCalledWith('/organizer/test-token');
    });
  });

  it('should show error message on exchange creation failure', async () => {
    const user = userEvent.setup();
    vi.mocked(api.createExchange).mockRejectedValue(new Error('Failed to create'));

    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    const input = screen.getByLabelText(/Exchange Name/i);
    const submitButton = screen.getByRole('button', { name: /Create Exchange/i });

    await user.type(input, 'Test Exchange');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to create/i)).toBeInTheDocument();
    });
  });

  it('should disable submit button when input is empty', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /Create Exchange/i });
    expect(submitButton).toBeDisabled();
  });

  it('should navigate to participant view on participant code submit', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    const codeInput = screen.getByLabelText(/Participant Code/i);
    const nameInput = screen.getByLabelText(/Your Name/i);
    const submitButton = screen.getByRole('button', { name: /View Match/i });

    await user.type(codeInput, 'ABC123');
    await user.type(nameInput, 'Test User');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/participant/ABC123?name=Test%20User');
    });
  });

  it('should show error when participant code or name is missing', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    const codeInput = screen.getByLabelText(/Participant Code/i) as HTMLInputElement;
    const nameInput = screen.getByLabelText(/Your Name/i) as HTMLInputElement;
    const submitButton = screen.getByRole('button', { name: /View Match/i });
    
    // Type only code, leave name empty
    await user.type(codeInput, 'ABC123');
    
    // The button should be disabled when name is empty
    expect(submitButton).toBeDisabled();
    
    // Now fill name but clear code
    await user.clear(codeInput);
    await user.type(nameInput, 'Test User');
    
    // Button should still be disabled when code is empty
    expect(submitButton).toBeDisabled();
    
    // Fill both - button should be enabled
    await user.type(codeInput, 'ABC123');
    expect(submitButton).not.toBeDisabled();
  });

  it('should convert participant code to uppercase', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    const codeInput = screen.getByLabelText(/Participant Code/i) as HTMLInputElement;
    await user.type(codeInput, 'abc123');

    expect(codeInput.value).toBe('ABC123');
  });

  it('should render organizer token input form', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/Organizer Token/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Access Exchange/i })).toBeInTheDocument();
  });

  it('should navigate to organizer dashboard on valid token', async () => {
    const user = userEvent.setup();
    const validToken = '12345678-1234-5678-90ab-cdef12345678';
    const mockExchange = {
      id: 'test-id',
      name: 'Test Exchange',
      organizerToken: validToken,
      participantCode: 'TEST12',
      status: 'draft',
      participants: [],
      createdAt: new Date().toISOString()
    };

    vi.mocked(api.getExchangeByOrganizerToken).mockResolvedValue(mockExchange);

    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    const tokenInput = screen.getByLabelText(/Organizer Token/i);
    const submitButton = screen.getByRole('button', { name: /Access Exchange/i });

    await user.type(tokenInput, validToken);
    await user.click(submitButton);

    await waitFor(() => {
      expect(api.getExchangeByOrganizerToken).toHaveBeenCalledWith(validToken);
      expect(mockNavigate).toHaveBeenCalledWith(`/organizer/${validToken}`);
    });
  });

  it('should show error for invalid token format', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    const tokenInput = screen.getByLabelText(/Organizer Token/i);
    const submitButton = screen.getByRole('button', { name: /Access Exchange/i });

    await user.type(tokenInput, 'invalid-token');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Invalid token format/i)).toBeInTheDocument();
    });
  });

  it('should show error for invalid organizer token', async () => {
    const user = userEvent.setup();

    vi.mocked(api.getExchangeByOrganizerToken).mockRejectedValue(new Error('Exchange not found'));

    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    const tokenInput = screen.getByLabelText(/Organizer Token/i);
    const submitButton = screen.getByRole('button', { name: /Access Exchange/i });

    await user.type(tokenInput, '00000000-0000-0000-0000-000000000000');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Exchange not found/i)).toBeInTheDocument();
    });
  });
});

