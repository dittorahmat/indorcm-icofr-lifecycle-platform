import { describe, it, expect } from 'vitest';
import { AppError, SIMULATION_NOT_FOUND, bad, notFound } from '../utils';

/**
 * Contract test for the unified error envelope (F0-3 tech-debt fix).
 * Guards: stable `error` codes + safe `message`, AppError status mapping.
 */
describe('AppError envelope', () => {
  it('exposes stable code and status', () => {
    const err = new AppError(SIMULATION_NOT_FOUND, 'Simulation not found', 404);
    expect(err.code).toBe('SIMULATION_NOT_FOUND');
    expect(err.status).toBe(404);
    expect(err.message).toBe('Simulation not found');
  });

  it('defaults to 400', () => {
    const err = new AppError('SUBMIT_FAILED', 'nope');
    expect(err.status).toBe(400);
  });

  it('exposes bad/notFound helpers', () => {
    expect(typeof bad).toBe('function');
    expect(typeof notFound).toBe('function');
  });
});
