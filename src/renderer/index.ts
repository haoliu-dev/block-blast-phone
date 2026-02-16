import { GameState } from '../logic/types';
import { gameReducer } from '../logic/reducer';
import { initCanvas, CanvasConfig, clearCanvas } from './canvas';
import { drawBoard, drawState, drawScore, drawShapes, drawCell } from './draw';
import { DragState, createInitialDragState, getGridPosition } from './input';
import { loadGameData } from '../storage/localStorage';
import { canPlace } from '../logic/placement';

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config!: CanvasConfig;
  private state: GameState;
  private dragState: DragState;

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
      if (this.state.status === 'idle') this.dispatch({ type: 'START_GAME' as const });
      else if (this.state.status === 'gameover') this.dispatch({ type: 'RESTART' as const });
      return;
    }
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const shapeStartX = this.config.width / 2 - (this.state.shapes.length * this.config.cellSize * 2) / 2;
    const shapeAreaY = this.config.height - this.config.cellSize * 4;
    for (let i = 0; i < this.state.shapes.length; i++) {
      const shapeX = shapeStartX + i * this.config.cellSize * 2;
      if (x >= shapeX && x <= shapeX + this.config.cellSize * 2 && y >= shapeAreaY && y <= shapeAreaY + this.config.cellSize * 3) {
        this.dragState = { isDragging: true, shape: this.state.shapes[i], startX: x, startY: y, currentX: x, currentY: y, previewRow: -1, previewCol: -1, isValidPlacement: false };
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
      this.dragState.previewRow = gridPos.row;
      this.dragState.previewCol = gridPos.col;
      this.dragState.isValidPlacement = canPlace(this.state.board, this.dragState.shape, gridPos.row, gridPos.col);
    } else {
      this.dragState.previewRow = -1;
      this.dragState.previewCol = -1;
    }
    this.render();
  }

  private handlePointerUp(_e: PointerEvent): void {
    if (this.dragState.isDragging && this.dragState.shape && this.dragState.isValidPlacement && this.dragState.previewRow >= 0) {
      this.dispatch({ type: 'PLACE_SHAPE' as const, shape: this.dragState.shape, row: this.dragState.previewRow, col: this.dragState.previewCol });
    }
    this.dragState = createInitialDragState();
    this.render();
  }

  private dispatch(action: { type: string; shape?: any; row?: number; col?: number }): void {
    this.state = gameReducer(this.state, action as any);
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
    if (this.dragState.isDragging && this.dragState.shape && this.dragState.previewRow >= 0 && this.dragState.isValidPlacement) {
      this.dragState.shape.cells.forEach(([row, col]: [number, number]) => {
        drawCell(this.ctx, this.dragState.previewRow + row, this.dragState.previewCol + col, this.dragState.shape!.color, this.config, 0.5);
      });
    }
    if (this.state.status === 'idle') this.drawOverlay('Tap to Start');
    else if (this.state.status === 'gameover') this.drawOverlay(`Game Over!\nScore: ${this.state.score}\nTap to Restart`);
  }

  private drawOverlay(text: string): void {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.config.width, this.config.height);
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 32px sans-serif';
    this.ctx.textAlign = 'center';
    const lines = text.split('\n');
    lines.forEach((line, i) => this.ctx.fillText(line, this.config.width / 2, this.config.height / 2 + i * 40));
  }
}
