export function validateParticipantName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Name is required' };
  }
  
  if (name.trim().length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  
  if (name.trim().length > 50) {
    return { valid: false, error: 'Name must be less than 50 characters' };
  }
  
  return { valid: true };
}

export function validateExchangeName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Exchange name is required' };
  }
  
  if (name.trim().length < 3) {
    return { valid: false, error: 'Exchange name must be at least 3 characters' };
  }
  
  if (name.trim().length > 100) {
    return { valid: false, error: 'Exchange name must be less than 100 characters' };
  }
  
  return { valid: true };
}

export function validateParticipantCode(code: string): { valid: boolean; error?: string } {
  if (!code || code.trim() === '') {
    return { valid: false, error: 'Participant code is required' };
  }
  
  if (code.trim().length !== 6) {
    return { valid: false, error: 'Participant code must be 6 characters' };
  }
  
  if (!/^[A-Z0-9]+$/.test(code.trim())) {
    return { valid: false, error: 'Participant code must contain only uppercase letters and numbers' };
  }
  
  return { valid: true };
}

