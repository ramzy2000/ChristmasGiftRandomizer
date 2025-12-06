import { Router } from 'express';
import { NotificationService } from '../services/notificationService.js';

const router = Router();

// Subscribe to push notifications
router.post('/subscribe', (req, res) => {
  try {
    const { participantId, subscription } = req.body;
    
    if (!participantId || !subscription) {
      return res.status(400).json({ error: 'participantId and subscription are required' });
    }

    // Store subscription (TODO: implement database storage)
    NotificationService.storeSubscription(participantId, subscription);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    res.status(500).json({ error: 'Failed to subscribe to notifications' });
  }
});

export default router;

