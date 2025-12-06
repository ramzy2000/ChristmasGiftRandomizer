import { Router } from 'express';
import { ExchangeModel } from '../models/Exchange.js';
import { ParticipantModel } from '../models/Participant.js';
import { MatchingService } from '../services/matchingService.js';
import { CreateExchangeRequest } from '../types.js';
import { validateExchangeName, validateToken } from '../middleware/validation.js';

const router = Router();

// Create a new exchange
router.post('/', validateExchangeName, (req, res) => {
  try {
    const data: CreateExchangeRequest = req.body;
    const exchange = ExchangeModel.create({ name: data.name });
    
    res.status(201).json({
      id: exchange.id,
      name: exchange.name,
      organizerToken: exchange.organizerToken,
      participantCode: exchange.participantCode,
      status: exchange.status,
      createdAt: exchange.createdAt
    });
  } catch (error) {
    console.error('Error creating exchange:', error);
    res.status(500).json({ error: 'Failed to create exchange' });
  }
});

// Get exchange by organizer token
router.get('/organizer/:token', (req, res) => {
  try {
    const { token } = req.params;
    const exchange = ExchangeModel.findByOrganizerToken(token);
    
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    res.json({
      id: exchange.id,
      name: exchange.name,
      organizerToken: exchange.organizerToken,
      participantCode: exchange.participantCode,
      status: exchange.status,
      participants: exchange.participants.map(p => ({
        id: p.id,
        name: p.name,
        excludedNames: p.excludedNames,
        matchedWith: p.matchedWith
      })),
      createdAt: exchange.createdAt,
      matchedAt: exchange.matchedAt
    });
  } catch (error) {
    console.error('Error fetching exchange:', error);
    res.status(500).json({ error: 'Failed to fetch exchange' });
  }
});

// Get exchange by participant code (limited info)
router.get('/participant/:code', (req, res) => {
  try {
    const { code } = req.params;
    const exchange = ExchangeModel.findByParticipantCode(code);
    
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    // Only return basic info, not full participant list
    res.json({
      id: exchange.id,
      name: exchange.name,
      status: exchange.status
    });
  } catch (error) {
    console.error('Error fetching exchange:', error);
    res.status(500).json({ error: 'Failed to fetch exchange' });
  }
});

// Generate matches for an exchange
router.post('/:token/match', validateToken, (req, res) => {
  try {
    const { token } = req.params;
    const exchange = ExchangeModel.findByOrganizerToken(token);
    
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    if (exchange.status === 'matched') {
      return res.status(400).json({ error: 'Exchange already matched' });
    }

    if (exchange.participants.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 participants' });
    }

    // Validate matching is possible
    const validation = MatchingService.validateMatchingPossible(exchange.participants);
    if (!validation.possible) {
      return res.status(400).json({ error: validation.error });
    }

    // Generate matches
    const result = MatchingService.generateMatches(exchange.participants);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    // Update exchange status
    ExchangeModel.updateStatus(exchange.id, 'matched');

    // Reload exchange to get updated participants
    const updatedExchange = ExchangeModel.findById(exchange.id)!;

    res.json({
      success: true,
      matches: result.matches,
      exchange: {
        id: updatedExchange.id,
        name: updatedExchange.name,
        status: updatedExchange.status,
        matchedAt: updatedExchange.matchedAt
      }
    });
  } catch (error) {
    console.error('Error generating matches:', error);
    res.status(500).json({ error: 'Failed to generate matches' });
  }
});

export default router;

