import { Shape, COLORS } from './types';

const SHAPE_DEFINITIONS: [number, number][][] = [
  // I-piece (4 in a line)
  [[0, 0], [0, 1], [0, 2], [0, 3]],
  // O-piece (2x2 square)
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  // T-piece
  [[0, 0], [0, 1], [0, 2], [1, 1]],
  // S-piece
  [[0, 1], [0, 2], [1, 0], [1, 1]],
  // Z-piece
  [[0, 0], [0, 1], [1, 1], [1, 2]],
  // J-piece
  [[0, 0], [1, 0], [1, 1], [1, 2]],
  // L-piece
  [[0, 2], [1, 0], [1, 1], [1, 2]],
];

let shapeIdCounter = 0;

export function rotateShape(cells: [number, number][], rotation: number): [number, number][] {
  if (rotation === 0) return cells;

  return cells.map(([row, col]) => {
    switch (rotation) {
      case 1: return [col, -row];
      case 2: return [-row, -col];
      case 3: return [-col, row];
      default: return [row, col];
    }
  });
}

export function createRandomShape(): Shape {
  const cells = SHAPE_DEFINITIONS[Math.floor(Math.random() * SHAPE_DEFINITIONS.length)];
  const color = Math.floor(Math.random() * COLORS.length) + 1;
  const rotation = Math.floor(Math.random() * 4);
  const rotatedCells = rotateShape(cells as [number, number][], rotation);

  const minRow = Math.min(...rotatedCells.map(([r]) => r));
  const minCol = Math.min(...rotatedCells.map(([_, c]) => c));
  const normalizedCells = rotatedCells.map(([r, c]) => [r - minRow, c - minCol] as [number, number]);

  return {
    id: `shape-${++shapeIdCounter}`,
    cells: normalizedCells,
    color,
  };
}

export function createShapes(count: number): Shape[] {
  return Array.from({ length: count }, () => createRandomShape());
}
