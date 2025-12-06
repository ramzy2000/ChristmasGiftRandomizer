import db from '../database/db.js';
import { Participant } from '../types.js';
import { v4 as uuidv4 } from 'uuid';

export class ParticipantModel {
  static create(data: {
    exchangeId: string;
    name: string;
    excludedNames?: string[];
  }): Participant {
    const id = uuidv4();
    
    const stmt = db.prepare(`
      INSERT INTO participants (id, exchange_id, name, excluded_names)
      VALUES (?, ?, ?, ?)
    `);
    
    stmt.run(
      id,
      data.exchangeId,
      data.name,
      JSON.stringify(data.excludedNames || [])
    );
    
    return {
      id,
      exchangeId: data.exchangeId,
      name: data.name,
      excludedNames: data.excludedNames || [],
      createdAt: new Date().toISOString()
    };
  }

  static findById(id: string): Participant | null {
    const participant = db.prepare('SELECT * FROM participants WHERE id = ?').get(id) as any;
    if (!participant) return null;
    
    return {
      id: participant.id,
      exchangeId: participant.exchange_id,
      name: participant.name,
      excludedNames: participant.excluded_names ? JSON.parse(participant.excluded_names) : [],
      matchedWith: participant.matched_with_id || undefined,
      createdAt: participant.created_at
    };
  }

  static findByExchangeId(exchangeId: string): Participant[] {
    const participants = db.prepare(`
      SELECT * FROM participants WHERE exchange_id = ? ORDER BY created_at
    `).all(exchangeId) as any[];
    
    return participants.map(p => ({
      id: p.id,
      exchangeId: p.exchange_id,
      name: p.name,
      excludedNames: p.excluded_names ? JSON.parse(p.excluded_names) : [],
      matchedWith: p.matched_with_id || undefined,
      createdAt: p.created_at
    }));
  }

  static updateMatch(giverId: string, receiverId: string): void {
    const stmt = db.prepare('UPDATE participants SET matched_with_id = ? WHERE id = ?');
    stmt.run(receiverId, giverId);
  }

  static delete(id: string): void {
    db.prepare('DELETE FROM participants WHERE id = ?').run(id);
  }
}

