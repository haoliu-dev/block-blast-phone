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
