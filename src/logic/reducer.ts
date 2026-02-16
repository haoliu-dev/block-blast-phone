import { GameState, GameAction, Shape, BOARD_SIZE } from './types';
import { createEmptyBoard, createInitialState } from './state';
import { createShapes, createRandomShape } from './shapes';
import { canPlace, placeShapeOnBoard } from './placement';
import { checkAndClearLines } from './lineClear';
import { calculateScore } from './scoring';
import { checkGameOver } from './gameover';

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      return {
        ...createInitialState(state.highScore),
        status: 'playing',
      };
    }

    case 'PLACE_SHAPE': {
      const { shape, row, col } = action;
      
      if (!canPlace(state.board, shape, row, col)) {
        return state;
      }

      let newBoard = placeShapeOnBoard(state.board, shape, row, col);
      const blockCount = shape.cells.length;

      const { board: clearedBoard, linesCleared } = checkAndClearLines(newBoard);
      newBoard = clearedBoard;

      const { points } = calculateScore(blockCount, linesCleared);
      const newScore = state.score + points;
      const newLinesCleared = state.linesCleared + linesCleared;

      const remainingShapes = state.shapes.filter(s => s.id !== shape.id);
      let newShapes = remainingShapes;

      if (remainingShapes.length === 0) {
        newShapes = createShapes(3);
      }

      const isOver = checkGameOver(newBoard, newShapes);
      const newHighScore = Math.max(state.highScore, newScore);

      return {
        ...state,
        board: newBoard,
        shapes: newShapes,
        score: newScore,
        linesCleared: newLinesCleared,
        status: isOver ? 'gameover' : 'playing',
        highScore: newHighScore,
      };
    }

    case 'RESTART': {
      return {
        ...createInitialState(state.highScore),
        status: 'playing',
      };
    }

    case 'SET_HIGH_SCORE': {
      return {
        ...state,
        highScore: action.score,
      };
    }

    default:
      return state;
  }
}
