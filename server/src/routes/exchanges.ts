import { Router } from 'express';
import { ExchangeModel } from '../models/Exchange.js';
import { ParticipantModel } from '../models/Participant.js';
import { MatchingService } from '../services/matchingService.js';
import { CreateExchangeRequest } from '../../../shared/types.js';
import { validateExchangeName, validateToken, validateParticipantCode } from '../middleware/validation.js';
import { logger } from '../utils/logger.js';

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
    logger.error({ err: error }, 'Error creating exchange');
    const message = error instanceof Error ? error.message : 'Failed to create exchange';
    res.status(500).json({ 
      error: message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get exchange by organizer token
router.get('/organizer/:token', validateToken, (req, res) => {
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
    logger.error({ err: error, token: req.params.token }, 'Error fetching exchange by organizer token');
    const message = error instanceof Error ? error.message : 'Failed to fetch exchange';
    res.status(500).json({ 
      error: message,
      timestamp: new Date().toISOString()
    });
  }
});

// Get exchange by participant code (limited info)
router.get('/participant/:code', validateParticipantCode, (req, res) => {
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
    logger.error({ err: error, token: req.params.token }, 'Error fetching exchange by organizer token');
    const message = error instanceof Error ? error.message : 'Failed to fetch exchange';
    res.status(500).json({ 
      error: message,
      timestamp: new Date().toISOString()
    });
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

    // Atomically check and update status to prevent race conditions
    // If another request already matched this exchange, this will fail
    const statusUpdated = ExchangeModel.updateStatusIfNotMatched(exchange.id, 'matched');
    if (!statusUpdated) {
      // Status was already 'matched' by another request
      return res.status(409).json({ error: 'Exchange was already matched by another request' });
    }

    // Generate matches
    const result = MatchingService.generateMatches(exchange.participants);
    
    if (!result.success) {
      // Rollback status update if matching failed
      ExchangeModel.updateStatus(exchange.id, exchange.status);
      return res.status(400).json({ error: result.error });
    }

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
    logger.error({ err: error, token: req.params.token }, 'Error generating matches');
    const message = error instanceof Error ? error.message : 'Failed to generate matches';
    res.status(500).json({ 
      error: message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;

