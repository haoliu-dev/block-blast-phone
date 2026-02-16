import { describe, test, expect } from 'bun:test';
import { gameReducer } from './reducer';
import { createInitialState } from './state';

describe('reducer', () => {
  test('START_GAME transitions to playing', () => {
    const state = createInitialState();
    const newState = gameReducer(state, { type: 'START_GAME' });
    expect(newState.status).toBe('playing');
  });

  test('PLACE_SHAPE adds blocks to board', () => {
    const state = { ...createInitialState(), status: 'playing' as const };
    const shape = { id: 'test', cells: [[0, 0]] as [number, number][], color: 1 };
    const newState = gameReducer(state, { type: 'PLACE_SHAPE', shape, row: 0, col: 0 });
    expect(newState.board[0][0]).toBe(1);
    expect(newState.score).toBe(10);
  });

  test('PLACE_SHAPE clears lines', () => {
    const state = {
      ...createInitialState(),
      status: 'playing' as const,
      board: Array.from({ length: 8 }, (_, i) => 
        i === 0 ? [1, 1, 1, 1, 1, 1, 1, 1] : Array(8).fill(0)
      ),
    };
    const shape = { id: 'test', cells: [[0, 0]] as [number, number][], color: 1 };
    const newState = gameReducer(state, { type: 'PLACE_SHAPE', shape, row: 1, col: 0 });
    expect(newState.linesCleared).toBe(1);
    expect(newState.board[0].every(c => c === 0)).toBe(true);
  });

  test('RESTART resets game', () => {
    const state = { ...createInitialState(), score: 100, status: 'gameover' as const };
    const newState = gameReducer(state, { type: 'RESTART' });
    expect(newState.score).toBe(0);
    expect(newState.status).toBe('playing');
  });
});
