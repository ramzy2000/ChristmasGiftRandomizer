import db from '../database/db.js';
import { Exchange, Participant } from '../../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

export class ExchangeModel {
  static create(data: { name: string }): Exchange {
    const id = uuidv4();
    const organizerToken = uuidv4();
    const participantCode = this.generateParticipantCode();
    
    const stmt = db.prepare(`
      INSERT INTO exchanges (id, name, organizer_token, participant_code, status)
      VALUES (?, ?, ?, ?, 'draft')
    `);
    
    stmt.run(id, data.name, organizerToken, participantCode);
    
    return {
      id,
      name: data.name,
      organizerToken,
      participantCode,
      status: 'draft',
      participants: [],
      createdAt: new Date().toISOString()
    };
  }

  static findById(id: string): Exchange | null {
    const exchange = db.prepare('SELECT * FROM exchanges WHERE id = ?').get(id) as any;
    if (!exchange) return null;
    
    const participants = this.getParticipants(id);
    
    return {
      id: exchange.id,
      name: exchange.name,
      organizerToken: exchange.organizer_token,
      participantCode: exchange.participant_code,
      status: exchange.status as any,
      participants,
      createdAt: exchange.created_at,
      matchedAt: exchange.matched_at || undefined
    };
  }

  static findByOrganizerToken(token: string): Exchange | null {
    const exchange = db.prepare('SELECT * FROM exchanges WHERE organizer_token = ?').get(token) as any;
    if (!exchange) return null;
    
    return this.findById(exchange.id);
  }

  static findByParticipantCode(code: string): Exchange | null {
    const exchange = db.prepare('SELECT * FROM exchanges WHERE participant_code = ?').get(code) as any;
    if (!exchange) return null;
    
    return this.findById(exchange.id);
  }

  static updateStatus(id: string, status: Exchange['status']): void {
    const stmt = db.prepare('UPDATE exchanges SET status = ?, matched_at = ? WHERE id = ?');
    const matchedAt = status === 'matched' ? new Date().toISOString() : null;
    stmt.run(status, matchedAt, id);
  }

  /**
   * Atomically update status only if current status is not 'matched'
   * Returns true if update was successful, false if status was already 'matched'
   * This prevents race conditions when multiple requests try to generate matches
   */
  static updateStatusIfNotMatched(id: string, status: Exchange['status']): boolean {
    const matchedAt = status === 'matched' ? new Date().toISOString() : null;
    const stmt = db.prepare(`
      UPDATE exchanges 
      SET status = ?, matched_at = ? 
      WHERE id = ? AND status != 'matched'
    `);
    const result = stmt.run(status, matchedAt, id);
    return result.changes > 0;
  }

  static getParticipants(exchangeId: string): Participant[] {
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

  private static generateParticipantCode(): string {
    // Generate a short, readable code (6 characters, alphanumeric)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing chars
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Ensure uniqueness
    const existing = db.prepare('SELECT id FROM exchanges WHERE participant_code = ?').get(code);
    if (existing) {
      return this.generateParticipantCode(); // Recursively try again
    }
    
    return code;
  }
}

