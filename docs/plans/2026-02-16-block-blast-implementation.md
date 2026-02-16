# Block Blast Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现完整的 Block Blast 方块消除游戏，包含游戏逻辑、Canvas 渲染、触屏交互、音效

**Architecture:** 函数式状态机架构 - 游戏逻辑为纯函数，渲染层独立，通过 action -> reducer -> new state -> render 的数据流运作

**Tech Stack:** Bun + TypeScript + HTML5 Canvas + Playwright

---

## 任务 1: 项目初始化

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `index.html`

**Step 1: 创建 package.json**

```json
{
  "name": "block-blast",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "build": "bun build src/index.ts --outdir=dist --target=browser",
    "test": "bun test",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "typescript": "^5.3.0"
  }
}
```

**Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Block Blast</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      touch-action: none;
      user-select: none;
      -webkit-user-select: none;
      background: #1a1a2e;
    }
    #game-canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  </style>
</head>
<body>
  <canvas id="game-canvas"></canvas>
  <script type="module" src="/src/index.ts"></script>
</body>
</html>
```

**Step 4: Commit**

```bash
git add package.json tsconfig.json index.html
git commit -m "chore: project init"
```

---

## 任务 2: 类型定义

**Files:**
- Create: `src/logic/types.ts`

**Step 1: 创建 types.ts**

```typescript
export type CellValue = number;
export type Board = CellValue[][];

export interface Shape {
  id: string;
  cells: [number, number][];
  color: number;
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover';

export interface GameState {
  board: Board;
  shapes: Shape[];
  score: number;
  linesCleared: number;
  status: GameStatus;
  highScore: number;
}

export interface Point {
  row: number;
  col: number;
}

export type GameAction =
  | { type: 'START_GAME' }
  | { type: 'PLACE_SHAPE'; shape: Shape; row: number; col: number }
  | { type: 'RESTART' }
  | { type: 'SET_HIGH_SCORE'; score: number };

export const BOARD_SIZE = 8;
export const SHAPES_TO_SPAWN = 3;

export const COLORS = [
  '#FF6B6B', // 红
  '#4ECDC4', // 青
  '#45B7D1', // 蓝
  '#96CEB4', // 绿
  '#FFEAA7', // 黄
  '#DDA0DD', // 紫
  '#F39C12', // 橙
] as const;
```

**Step 2: Commit**

```bash
git add src/logic/types.ts
git commit -m "feat: add type definitions"
```

---

## 任务 3: 形状定义和生成

**Files:**
- Create: `src/logic/shapes.ts`

**Step 1: 创建 shapes.ts**

```typescript
import { Shape, COLORS } from './types';

const SHAPE_DEFINITIONS: [number, number][][] = [
  [[0, 0]], // 单格
  [[0, 0], [0, 1]], // 水平双格
  [[0, 0], [1, 0]], // 垂直双格
  [[0, 0], [0, 1], [0, 2]], // 水平三格
  [[0, 0], [1, 0], [2, 0]], // 垂直三格
  [[0, 0], [0, 1], [1, 0], [1, 1]], // 2x2 正方形
  [[0, 0], [0, 1], [0, 2], [1, 0]], // L 形
  [[0, 0], [0, 1], [0, 2], [1, 1]], // T 形
  [[0, 0], [0, 1], [1, 1], [1, 2]], // Z 形
  [[0, 1], [0, 2], [1, 0], [1, 1]], // S 形
  [[0, 0], [0, 1], [0, 2], [0, 3]], // 水平四格
  [[0, 0], [1, 0], [2, 0], [3, 0]], // 垂直四格
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]], // 2x3 矩形
  [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]], // 3x3 正方形
];

let shapeIdCounter = 0;

export function createRandomShape(): Shape {
  const cells = SHAPE_DEFINITIONS[Math.floor(Math.random() * SHAPE_DEFINITIONS.length)];
  const color = Math.floor(Math.random() * COLORS.length) + 1;
  return {
    id: `shape-${++shapeIdCounter}`,
    cells: cells as [number, number][],
    color,
  };
}

export function createShapes(count: number): Shape[] {
  return Array.from({ length: count }, () => createRandomShape());
}
```

**Step 2: 创建单元测试**

```typescript
// src/logic/shapes.test.ts
import { describe, test, expect } from 'bun:test';
import { createRandomShape, createShapes } from './shapes';

describe('shapes', () => {
  test('createRandomShape generates valid shape', () => {
    const shape = createRandomShape();
    expect(shape.id).toBeDefined();
    expect(shape.cells.length).toBeGreaterThan(0);
    expect(shape.color).toBeGreaterThan(0);
    expect(shape.color).toBeLessThanOrEqual(7);
  });

  test('createShapes generates correct count', () => {
    const shapes = createShapes(3);
    expect(shapes.length).toBe(3);
  });
});
```

**Step 3: 运行测试验证**

```bash
bun test src/logic/shapes.test.ts
# 期望: PASS
```

**Step 4: Commit**

```bash
git add src/logic/shapes.ts src/logic/shapes.test.ts
git commit -m "feat: add shape definitions and generation"
```

---

## 任务 4: 初始状态

**Files:**
- Create: `src/logic/state.ts`

**Step 1: 创建 state.ts**

```typescript
import { GameState, BOARD_SIZE, SHAPES_TO_SPAWN } from './types';
import { createShapes } from './shapes';

export function createEmptyBoard(): GameState['board'] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => 0)
  );
}

export function createInitialState(highScore: number = 0): GameState {
  return {
    board: createEmptyBoard(),
    shapes: createShapes(SHAPES_TO_SPAWN),
    score: 0,
    linesCleared: 0,
    status: 'idle',
    highScore,
  };
}
```

**Step 2: 创建单元测试**

```typescript
// src/logic/state.test.ts
import { describe, test, expect } from 'bun:test';
import { createEmptyBoard, createInitialState } from './state';

describe('state', () => {
  test('createEmptyBoard creates 8x8 grid', () => {
    const board = createEmptyBoard();
    expect(board.length).toBe(8);
    expect(board[0].length).toBe(8);
    expect(board[0][0]).toBe(0);
  });

  test('createInitialState creates valid state', () => {
    const state = createInitialState();
    expect(state.board.length).toBe(8);
    expect(state.shapes.length).toBe(3);
    expect(state.score).toBe(0);
    expect(state.status).toBe('idle');
  });
});
```

**Step 3: 运行测试验证**

```bash
bun test src/logic/state.test.ts
# 期望: PASS
```

**Step 4: Commit**

```bash
git add src/logic/state.ts src/logic/state.test.ts
git commit -m "feat: add state creation"
```

---

## 任务 5: 放置形状逻辑

**Files:**
- Create: `src/logic/placement.ts`

**Step 1: 创建 placement.ts**

```typescript
import { Board, Shape, BOARD_SIZE } from './types';

export function canPlace(board: Board, shape: Shape, row: number, col: number): boolean {
  for (const [dr, dc] of shape.cells) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (newRow < 0 || newRow >= BOARD_SIZE || newCol < 0 || newCol >= BOARD_SIZE) {
      return false;
    }
    if (board[newRow][newCol] !== 0) {
      return false;
    }
  }
  return true;
}

export function placeShapeOnBoard(board: Board, shape: Shape, row: number, col: number): Board {
  const newBoard = board.map(r => [...r]);
  for (const [dr, dc] of shape.cells) {
    newBoard[row + dr][col + dc] = shape.color;
  }
  return newBoard;
}
```

**Step 2: 创建单元测试**

```typescript
// src/logic/placement.test.ts
import { describe, test, expect } from 'bun:test';
import { canPlace, placeShapeOnBoard } from './placement';
import { createEmptyBoard } from './state';
import { createRandomShape } from './shapes';

describe('placement', () => {
  test('canPlace returns true for valid placement', () => {
    const board = createEmptyBoard();
    const shape = { id: 'test', cells: [[0, 0]] as [number, number][], color: 1 };
    expect(canPlace(board, shape, 0, 0)).toBe(true);
  });

  test('canPlace returns false for occupied cell', () => {
    const board = createEmptyBoard();
    board[0][0] = 1;
    const shape = { id: 'test', cells: [[0, 0]] as [number, number][], color: 1 };
    expect(canPlace(board, shape, 0, 0)).toBe(false);
  });

  test('canPlace returns false for out of bounds', () => {
    const board = createEmptyBoard();
    const shape = { id: 'test', cells: [[0, 0]] as [number, number][], color: 1 };
    expect(canPlace(board, shape, -1, 0)).toBe(false);
    expect(canPlace(board, shape, 0, -1)).toBe(false);
    expect(canPlace(board, shape, 7, 7)).toBe(true);
  });

  test('placeShapeOnBoard correctly places shape', () => {
    const board = createEmptyBoard();
    const shape = { id: 'test', cells: [[0, 0], [0, 1]] as [number, number][], color: 3 };
    const newBoard = placeShapeOnBoard(board, shape, 0, 0);
    expect(newBoard[0][0]).toBe(3);
    expect(newBoard[0][1]).toBe(3);
  });
});
```

**Step 3: 运行测试验证**

```bash
bun test src/logic/placement.test.ts
# 期望: PASS
```

**Step 4: Commit**

```bash
git add src/logic/placement.ts src/logic/placement.test.ts
git commit -m "feat: add shape placement logic"
```

---

## 任务 6: 行/列检测和消除

**Files:**
- Create: `src/logic/lineClear.ts`

**Step 1: 创建 lineClear.ts**

```typescript
import { Board, BOARD_SIZE } from './types';

export interface LineClearResult {
  board: Board;
  linesCleared: number;
}

export function checkAndClearLines(board: Board): LineClearResult {
  const newBoard = board.map(row => [...row]);
  const rowsToClear: number[] = [];
  const colsToClear: number[] = [];

  for (let row = 0; row < BOARD_SIZE; row++) {
    if (newBoard[row].every(cell => cell !== 0)) {
      rowsToClear.push(row);
    }
  }

  for (let col = 0; col < BOARD_SIZE; col++) {
    let full = true;
    for (let row = 0; row < BOARD_SIZE; row++) {
      if (newBoard[row][col] === 0) {
        full = false;
        break;
      }
    }
    if (full) {
      colsToClear.push(col);
    }
  }

  for (const row of rowsToClear) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      newBoard[row][col] = 0;
    }
  }

  for (const col of colsToClear) {
    for (let row = 0; row < BOARD_SIZE; row++) {
      newBoard[row][col] = 0;
    }
  }

  return {
    board: newBoard,
    linesCleared: rowsToClear.length + colsToClear.length,
  };
}
```

**Step 2: 创建单元测试**

```typescript
// src/logic/lineClear.test.ts
import { describe, test, expect } from 'bun:test';
import { checkAndClearLines } from './lineClear';
import { createEmptyBoard } from './state';

describe('lineClear', () => {
  test('clear full row', () => {
    const board = createEmptyBoard();
    board[0] = [1, 1, 1, 1, 1, 1, 1, 1];
    const result = checkAndClearLines(board);
    expect(result.linesCleared).toBe(1);
    expect(result.board[0].every(c => c === 0)).toBe(true);
  });

  test('clear full column', () => {
    const board = createEmptyBoard();
    for (let row = 0; row < 8; row++) board[row][0] = 1;
    const result = checkAndClearLines(board);
    expect(result.linesCleared).toBe(1);
    expect(result.board[0][0]).toBe(0);
  });

  test('clear multiple lines', () => {
    const board = createEmptyBoard();
    board[0] = [1, 1, 1, 1, 1, 1, 1, 1];
    for (let row = 0; row < 8; row++) board[row][0] = 1;
    const result = checkAndClearLines(board);
    expect(result.linesCleared).toBe(2);
  });

  test('no lines to clear', () => {
    const board = createEmptyBoard();
    const result = checkAndClearLines(board);
    expect(result.linesCleared).toBe(0);
  });
});
```

**Step 3: 运行测试验证**

```bash
bun test src/logic/lineClear.test.ts
# 期望: PASS
```

**Step 4: Commit**

```bash
git add src/logic/lineClear.ts src/logic/lineClear.test.ts
git commit -m "feat: add line detection and clearing"
```

---

## 任务 7: 得分计算

**Files:**
- Create: `src/logic/scoring.ts`

**Step 1: 创建 scoring.ts**

```typescript
export interface ScoreResult {
  points is: number;
 Combo: boolean;
}

const POINTS_PER_BLOCK = 10;
const POINTS_PER_LINE = 100;

const COMBO_MULTIPLIER: Record<number, number> = {
  2: 1.5,
  3: 2.0,
  4: 2.5,
};

export function calculateScore(blocksPlaced: number, linesCleared: number, isCombo: boolean = false): ScoreResult {
  let points = blocksPlaced * POINTS_PER_BLOCK;
  
  if (linesCleared > 0) {
    const baseLinePoints = linesCleared * POINTS_PER_LINE;
    const multiplier = COMBO_MULTIPLIER[linesCleared] || 1;
    points += Math.floor(baseLinePoints * multiplier);
  }

  return { points, isCombo: linesCleared > 1 || isCombo };
}
```

**Step 2: 创建单元测试**

```typescript
// src/logic/scoring.test.ts
import { describe, test, expect } from 'bun:test';
import { calculateScore } from './scoring';

describe('scoring', () => {
  test('base points for placing blocks', () => {
    const result = calculateScore(4, 0);
    expect(result.points).toBe(40);
  });

  test('points for clearing lines', () => {
    const result = calculateScore(0, 1);
    expect(result.points).toBe(100);
  });

  test('combo multiplier for 2 lines', () => {
    const result = calculateScore(0, 2);
    expect(result.points).toBe(300); // 2 * 100 * 1.5
  });

  test('combo multiplier for 3 lines', () => {
    const result = calculateScore(0, 3);
    expect(result.points).toBe(600); // 3 * 100 * 2
  });

  test('combo multiplier for 4+ lines', () => {
    const result = calculateScore(0, 4);
    expect(result.points).toBe(1000); // 4 * 100 * 2.5
  });
});
```

**Step 3: 运行测试验证**

```bash
bun test src/logic/scoring.test.ts
# 期望: PASS
```

**Step 4: Commit**

```bash
git add src/logic/scoring.ts src/logic/scoring.test.ts
git commit -m "feat: add scoring system"
```

---

## 任务 8: 游戏结束检测

**Files:**
- Create: `src/logic/gameover.ts`

**Step 1: 创建 gameover.ts**

```typescript
import { Board, Shape, BOARD_SIZE } from './types';
import { canPlace } from './placement';

export function checkGameOver(board: Board, shapes: Shape[]): boolean {
  if (shapes.length === 0) return false;

  for (const shape of shapes) {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (canPlace(board, shape, row, col)) {
          return false;
        }
      }
    }
  }
  return true;
}
```

**Step 2: 创建单元测试**

```typescript
// src/logic/gameover.test.ts
import { describe, test, expect } from 'bun:test';
import { checkGameOver } from './gameover';
import { createEmptyBoard } from './state';

describe('gameover', () => {
  test('not game over when shape can be placed', () => {
    const board = createEmptyBoard();
    const shapes = [{ id: 'test', cells: [[0, 0]], color: 1 }];
    expect(checkGameOver(board, shapes)).toBe(false);
  });

  test('game over when no shapes available', () => {
    const board = createEmptyBoard();
    expect(checkGameOver(board, [])).toBe(false);
  });

  test('game over when board is full', () => {
    const board = Array.from({ length: 8 }, () => Array(8).fill(1));
    const shapes = [{ id: 'test', cells: [[0, 0]], color: 1 }];
    expect(checkGameOver(board, shapes)).toBe(true);
  });
});
```

**Step 3: 运行测试验证**

```bash
bun test src/logic/gameover.test.ts
# 期望: PASS
```

**Step 4: Commit**

```bash
git add src/logic/gameover.ts src/logic/gameover.test.ts
git commit -m "feat: add game over detection"
```

---

## 任务 9: Reducer 状态机

**Files:**
- Create: `src/logic/reducer.ts`

**Step 1: 创建 reducer.ts**

```typescript
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
```

**Step 2: 创建单元测试**

```typescript
// src/logic/reducer.test.ts
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
```

**Step 3: 运行测试验证**

```bash
bun test src/logic/reducer.test.ts
# 期望: PASS
```

**Step 4: Commit**

```bash
git add src/logic/reducer.ts src/logic/reducer.test.ts
git commit -m "feat: add game reducer state machine"
```

---

## 任务 10: 存储层

**Files:**
- Create: `src/storage/localStorage.ts`

**Step 1: 创建 localStorage.ts**

```typescript
import { GameData } from './types';

const STORAGE_KEY = 'block-blast-data';

export function loadGameData(): GameData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('Failed to load game data:', e);
  }
  return { highScore: 0, settings: { soundEnabled: false } };
}

export function saveGameData(data: GameData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save game data:', e);
  }
}
```

**Step 2: Commit**

```bash
git add src/storage/localStorage.ts
git commit -m "feat: add local storage persistence"
```

---

## 任务 11: 渲染层 - Canvas 初始化

**Files:**
- Create: `src/renderer/canvas.ts`

**Step 1: 创建 canvas.ts**

```typescript
import { GameState } from '../logic/types';

export interface CanvasConfig {
  width: number;
  height: number;
  cellSize: number;
  gridOffsetX: number;
  gridOffsetY: number;
}

export function initCanvas(canvas: HTMLCanvasElement): CanvasConfig {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  
  const ctx = canvas.getContext('2d')!;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
  
  const displayWidth = rect.width;
  const displayHeight = rect.height;
  
  const cellSize = Math.min(displayWidth, displayHeight) / 10;
  const gridSize = cellSize * 8;
  const gridOffsetX = (displayWidth - gridSize) / 2;
  const gridOffsetY = displayHeight * 0.15;
  
  return {
    width: displayWidth,
    height: displayHeight,
    cellSize,
    gridOffsetX,
    gridOffsetY,
  };
}

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, width, height);
}
```

**Step 2: Commit**

```bash
git add src/renderer/canvas.ts
git commit -m "feat: add canvas initialization"
```

---

## 任务 12: 渲染层 - 绘制函数

**Files:**
- Create: `src/renderer/draw.ts`

**Step 1: 创建 draw.ts**

```typescript
import { GameState, COLORS, BOARD_SIZE } from '../logic/types';
import { CanvasConfig } from './canvas';

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  config: CanvasConfig
): void {
  const { cellSize, gridOffsetX, gridOffsetY } = config;
  
  ctx.strokeStyle = '#2a2a4e';
  ctx.lineWidth = 1;
  
  for (let row = 0; row <= BOARD_SIZE; row++) {
    const y = gridOffsetY + row * cellSize;
    ctx.beginPath();
    ctx.moveTo(gridOffsetX, y);
    ctx.lineTo(gridOffsetX + BOARD_SIZE * cellSize, y);
    ctx.stroke();
  }
  
  for (let col = 0; col <= BOARD_SIZE; col++) {
    const x = gridOffsetX + col * cellSize;
    ctx.beginPath();
    ctx.moveTo(x, gridOffsetY);
    ctx.lineTo(x, gridOffsetY + BOARD_SIZE * cellSize);
    ctx.stroke();
  }
}

export function drawCell(
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  colorIndex: number,
  config: CanvasConfig,
  alpha: number = 1
): void {
  const { cellSize, gridOffsetX, gridOffsetY } = config;
  const x = gridOffsetX + col * cellSize;
  const y = gridOffsetY + row * cellSize;
  const padding = 2;
  
  ctx.globalAlpha = alpha;
  ctx.fillStyle = COLORS[colorIndex - 1];
  ctx.fillRect(
    x + padding,
    y + padding,
    cellSize - padding * 2,
    cellSize - padding * 2
  );
  
  ctx.globalAlpha = 1;
}

export function drawState(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  config: CanvasConfig
): void {
  const { board } = state;
  
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] !== 0) {
        drawCell(ctx, row, col, board[row][col], config);
      }
    }
  }
}

export function drawScore(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  config: CanvasConfig
): void {
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Score: ${state.score}`, config.width / 2, 40);
  ctx.font = '16px sans-serif';
  ctx.fillText(`Lines: ${state.linesCleared}`, config.width / 2, 70);
}

export function drawShapes(
  ctx: CanvasRenderingContext2D,
  shapes: { cells: [number, number][]; color: number }[],
  config: CanvasConfig
): void {
  const shapeWidth = config.cellSize * 2;
  const startX = config.width / 2 - (shapes.length * shapeWidth) / 2;
  const startY = config.height - config.cellSize * 4;
  
  shapes.forEach((shape, index) => {
    const offsetX = startX + index * shapeWidth + shapeWidth / 2;
    const offsetY = startY + config.cellSize;
    
    shape.cells.forEach(([row, col]) => {
      ctx.fillStyle = COLORS[shape.color - 1];
      ctx.fillRect(
        offsetX + col * config.cellSize * 0.5,
        offsetY + row * config.cellSize * 0.5,
        config.cellSize * 0.5 - 1,
        config.cellSize * 0.5 - 1
      );
    });
  });
}
```

**Step 2: Commit**

```bash
git add src/renderer/draw.ts
git commit -m "feat: add drawing functions"
```

---

## 任务 13: 渲染层 - 输入处理

**Files:**
- Create: `src/renderer/input.ts`

**Step 1: 创建 input.ts**

```typescript
import { GameState, Shape } from '../logic/types';
import { CanvasConfig } from './canvas';
import { canPlace } from '../logic/placement';

export interface DragState {
  isDragging: boolean;
  shape: Shape | null;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  previewRow: number;
  previewCol: number;
  isValidPlacement: boolean;
}

export function createInitialDragState(): DragState {
  return {
    isDragging: false,
    shape: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    previewRow: -1,
    previewCol: -1,
    isValidPlacement: false,
  };
}

export function getGridPosition(
  x: number,
  y: number,
  config: CanvasConfig
): { row: number; col: number } | null {
  const { cellSize, gridOffsetX, gridOffsetY } = config;
  
  const col = Math.floor((x - gridOffsetX) / cellSize);
  const row = Math.floor((y - gridOffsetY) / cellSize);
  
  if (row >= 0 && row < 8 && col >= 0 && col < 8) {
    return { row, col };
  }
  return null;
}

export function isOverShapeArea(
  x: number,
  y: number,
  config: CanvasConfig,
  shapeIndex: number
): boolean {
  const shapeWidth = config.cellSize * 2;
  const totalWidth = shapeWidth * 3;
  const startX = config.width / 2 - totalWidth / 2;
  const startY = config.height - config.cellSize * 4;
  
  const shapeX = startX + shapeIndex * shapeWidth;
  
  return (
    x >= shapeX &&
    x <= shapeX + shapeWidth &&
    y >= startY &&
    y <= startY + config.cellSize * 3
  );
}
```

**Step 2: Commit**

```bash
git add src/renderer/input.ts
git commit -m "feat: add input handling"
```

---

## 任务 14: 渲染层 - 主入口

**Files:**
- Create: `src/renderer/index.ts`

**Step 1: 创建 renderer/index.ts**

```typescript
import { GameState } from '../logic/types';
import { gameReducer } from '../logic/reducer';
import { initCanvas, CanvasConfig, clearCanvas } from './canvas';
import { drawBoard, drawState, drawScore, drawShapes } from './draw';
import { DragState, createInitialDragState, getGridPosition, isOverShapeArea } from './input';
import { loadGameData } from '../storage/localStorage';

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config!: CanvasConfig;
  private state: GameState;
  private dragState: DragState;
  private onPlaceShape?: (shape: { id: string; cells: [number, number][]; color: number }, row: number, col: number) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    
    const savedData = loadGameData();
    this.state = {
      board: Array.from({ length: 8 }, () => Array(8).fill(0)),
      shapes: [],
      score: 0,
      linesCleared: 0,
      status: 'idle',
      highScore: savedData.highScore,
    };
    
    this.dragState = createInitialDragState();
    this.init();
  }

  private init(): void {
    this.config = initCanvas(this.canvas);
    this.bindEvents();
    this.render();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('pointerdown', this.handlePointerDown.bind(this));
    this.canvas.addEventListener('pointermove', this.handlePointerMove.bind(this));
    this.canvas.addEventListener('pointerup', this.handlePointerUp.bind(this));
    this.canvas.addEventListener('pointercancel', this.handlePointerUp.bind(this));
  }

  private handlePointerDown(e: PointerEvent): void {
    if (this.state.status !== 'playing') {
      if (this.state.status === 'idle') {
        this.dispatch({ type: 'START_GAME' });
      } else if (this.state.status === 'gameover') {
        this.dispatch({ type: 'RESTART' });
      }
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const shapeStartX = this.config.width / 2 - (this.state.shapes.length * this.config.cellSize * 2) / 2;
    const shapeAreaY = this.config.height - this.config.cellSize * 4;

    for (let i = 0; i < this.state.shapes.length; i++) {
      const shapeX = shapeStartX + i * this.config.cellSize * 2;
      if (x >= shapeX && x <= shapeX + this.config.cellSize * 2 &&
          y >= shapeAreaY && y <= shapeAreaY + this.config.cellSize * 3) {
        this.dragState = {
          isDragging: true,
          shape: this.state.shapes[i],
          startX: x,
          startY: y,
          currentX: x,
          currentY: y,
          previewRow: -1,
          previewCol: -1,
          isValidPlacement: false,
        };
        return;
      }
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.dragState.isDragging || !this.dragState.shape) return;

    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.dragState.currentX = x;
    this.dragState.currentY = y;

    const gridPos = getGridPosition(x, y, this.config);
    if (gridPos) {
      const { canPlace } = require('../logic/placement');
      this.dragState.previewRow = gridPos.row;
      this.dragState.previewCol = gridPos.col;
      this.dragState.isValidPlacement = canPlace(this.state.board, this.dragState.shape, gridPos.row, gridPos.col);
    } else {
      this.dragState.previewRow = -1;
      this.dragState.previewCol = -1;
    }

    this.render();
  }

  private handlePointerUp(e: PointerEvent): void {
    if (this.dragState.isDragging && this.dragState.shape) {
      if (this.dragState.isValidPlacement && this.dragState.previewRow >= 0) {
        this.dispatch({
          type: 'PLACE_SHAPE',
          shape: this.dragState.shape,
          row: this.dragState.previewRow,
          col: this.dragState.previewCol,
        });
      }
    }

    this.dragState = createInitialDragState();
    this.render();
  }

  private dispatch(action: { type: string; shape?: any; row?: number; col?: number }): void {
    this.state = gameReducer(this.state, action as any);
    this.render();
  }

  public setState(state: GameState): void {
    this.state = state;
    this.render();
  }

  public render(): void {
    clearCanvas(this.ctx, this.config.width, this.config.height);
    drawBoard(this.ctx, this.config);
    drawState(this.ctx, this.state, this.config);
    drawScore(this.ctx, this.state, this.config);

    if (this.state.status === 'playing' && this.state.shapes.length > 0) {
      drawShapes(this.ctx, this.state.shapes, this.config);
    }

    if (this.dragState.isDragging && this.dragState.shape && this.dragState.previewRow >= 0) {
      const { drawCell } = require('./draw');
      const color = this.dragState.isValidPlacement ? this.dragState.shape.color : 0;
      if (this.dragState.isValidPlacement) {
        this.dragState.shape.cells.forEach(([row, col]: [number, number]) => {
          drawCell(
            this.ctx,
            this.dragState.previewRow + row,
            this.dragState.previewCol + col,
            color,
            this.config,
            0.5
          );
        });
      }
    }

    if (this.state.status === 'idle') {
      this.drawOverlay('Tap to Start');
    } else if (this.state.status === 'gameover') {
      this.drawOverlay(`Game Over!\nScore: ${this.score}\nTap to Restart`);
    }
  }

  private drawOverlay(text: string): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 32px sans-serif';
    this.ctx.textAlign = 'center';
    
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      this.ctx.fillText(line, this.config.width / 2, this.config.height / 2 + i * 40);
    });
  }

  private get score(): number {
    return this.state.score;
  }
}
```

**Step 2: Commit**

```bash
git add src/renderer/index.ts
git commit -m "feat: add renderer main entry"
```

---

## 任务 15: 音效系统

**Files:**
- Create: `src/audio/sounds.ts`

**Step 1: 创建 sounds.ts**

```typescript
type SoundType = 'place' | 'placeFail' | 'clear' | 'combo' | 'gameover';

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = false;

  init(): void {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.enabled = true;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  play(type: SoundType): void {
    if (!this.enabled || !this.audioContext) return;

    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'place':
        osc.frequency.setValueAtTime(800, now);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
        break;

      case 'placeFail':
        osc.frequency.setValueAtTime(200, now);
        osc.type = 'sawtooth';
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;

      case 'clear':
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.1);
        osc.frequency.setValueAtTime(784, now + 0.2);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'combo':
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.1);
        osc.frequency.setValueAtTime(784, now + 0.2);
        osc.frequency.setValueAtTime(1047, now + 0.3);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case 'gameover':
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.5);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;
    }
  }
}

export const soundManager = new SoundManager();
```

**Step 2: Commit**

```bash
git add src/audio/sounds.ts
git commit -m "feat: add sound system"
```

---

## 任务 16: 主入口

**Files:**
- Create: `src/index.ts`

**Step 1: 创建 index.ts**

```typescript
import { GameRenderer } from './renderer/index';
import { soundManager } from './audio/sounds';

function init(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }

  const renderer = new GameRenderer(canvas);
  
  canvas.addEventListener('touchstart', () => {
    soundManager.init();
  }, { once: true });
  
  canvas.addEventListener('click', () => {
    soundManager.init();
  }, { once: true });
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', init);
}
```

**Step 2: Commit**

```bash
git add src/index.ts
git commit -m "feat: add main entry point"
```

---

## 任务 17: E2E 测试

**Files:**
- Create: `tests/e2e/game.spec.ts`

**Step 1: 创建 E2E 测试**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Block Blast Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
  });

  test('game loads and shows start screen', async ({ page }) => {
    await page.waitForSelector('#game-canvas');
  });

  test('tap to start game', async ({ page }) => {
    await page.click('#game-canvas');
    await page.waitForTimeout(500);
  });

  test('complete game flow', async ({ page }) => {
    await page.click('#game-canvas');
    await page.waitForTimeout(500);
    
    const canvas = page.locator('#game-canvas');
    const box = await canvas.boundingBox();
    
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height - 100);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.up();
    }
  });
});
```

**Step 2: 创建 playwright.config.ts**

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  },
});
```

**Step 3: Commit**

```bash
git add tests/e2e/game.spec.ts playwright.config.ts
git commit -m "test: add E2E tests"
```

---

## 任务 18: 运行所有测试并验证

**Step 1: 运行单元测试**

```bash
bun test
# 期望: 所有测试 PASS
```

**Step 2: 验证构建**

```bash
npm run build
# 期望: 构建成功
```

**Step 3: 最终 Commit**

```bash
git add .
git commit -m "feat: complete Block Blast game implementation"
```

---

**Plan complete and saved to `docs/plans/2026-02-16-block-blast-design.md` (updated with implementation steps).**

**Two execution options:**

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
