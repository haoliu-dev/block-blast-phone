import { GameState, COLORS, BOARD_SIZE, Board } from '../logic/types';
import { gameReducer } from '../logic/reducer';
import { initCanvas, CanvasConfig, clearCanvas } from './canvas';
import { drawBoard, drawState, drawScore, drawShapes, drawCell } from './draw';
import { DragState, createInitialDragState, getGridPosition } from './input';
import { loadGameData } from '../storage/localStorage';
import { canPlace } from '../logic/placement';
import { soundManager } from '../audio/sounds';

export class GameRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config!: CanvasConfig;
  private state: GameState;
  private dragState: DragState;
  private linesToClear: { rows: number[]; cols: number[] } = { rows: [], cols: [] };
  private animatingLines: { rows: number[]; cols: number[]; startTime: number } | null = null;

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
    const shapeWidth = this.config.cellSize * 4 * 0.7;
    const shapeStartX = this.config.width / 2 - (this.state.shapes.length * shapeWidth) / 2;
    const shapeAreaY = this.config.height - this.config.cellSize * 5 + this.config.cellSize;
    for (let i = 0; i < this.state.shapes.length; i++) {
      const shapeX = shapeStartX + i * shapeWidth;
      if (x >= shapeX && x <= shapeX + shapeWidth && y >= shapeAreaY && y <= shapeAreaY + this.config.cellSize * 4 * 0.7) {
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

      if (this.dragState.isValidPlacement) {
        this.linesToClear = this.calculateLinesToClear(this.state.board, this.dragState.shape, gridPos.row, gridPos.col);
      } else {
        this.linesToClear = { rows: [], cols: [] };
      }
    } else {
      this.dragState.previewRow = -1;
      this.dragState.previewCol = -1;
      this.linesToClear = { rows: [], cols: [] };
    }
    this.render();
  }

  private handlePointerUp(_e: PointerEvent): void {
    if (this.dragState.isDragging && this.dragState.shape && this.dragState.isValidPlacement && this.dragState.previewRow >= 0) {
      const linesBefore = this.calculateLinesToClear(this.state.board, this.dragState.shape, this.dragState.previewRow, this.dragState.previewCol);
      this.dispatch({ type: 'PLACE_SHAPE' as const, shape: this.dragState.shape, row: this.dragState.previewRow, col: this.dragState.previewCol });
      soundManager.play('place');
      if (linesBefore.rows.length > 0 || linesBefore.cols.length > 0) {
        this.startLineClearAnimation(linesBefore.rows, linesBefore.cols);
      }
    } else if (this.dragState.isDragging) {
      soundManager.play('placeFail');
    }
    this.dragState = createInitialDragState();
    this.linesToClear = { rows: [], cols: [] };
    this.render();
  }

  private calculateLinesToClear(board: Board, shape: { cells: [number, number][] }, row: number, col: number): { rows: number[]; cols: number[] } {
    const rows: number[] = [];
    const cols: number[] = [];
    const tempBoard = board.map(r => [...r]);
    shape.cells.forEach(([r, c]) => {
      tempBoard[row + r][col + c] = 1;
    });

    for (let r = 0; r < BOARD_SIZE; r++) {
      if (tempBoard[r].every(cell => cell !== 0)) rows.push(r);
    }
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (tempBoard.every(r => r[c] !== 0)) cols.push(c);
    }

    return { rows, cols };
  }

  private startLineClearAnimation(rows: number[], cols: number[]): void {
    this.animatingLines = { rows, cols, startTime: Date.now() };
    soundManager.play('clear');

    const animate = () => {
      if (!this.animatingLines) return;
      const elapsed = Date.now() - this.animatingLines.startTime;
      if (elapsed > 500) {
        this.animatingLines = null;
        this.render();
        return;
      }
      this.render();
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  private dispatch(action: { type: string; shape?: any; row?: number; col?: number }): void {
    this.state = gameReducer(this.state, action as any);
    this.render();
  }

  public render(): void {
    clearCanvas(this.ctx, this.config.width, this.config.height);
    drawBoard(this.ctx, this.config);
    drawState(this.ctx, this.state, this.config);

    // Draw line clear preview (yellow highlight)
    if ((this.linesToClear.rows.length > 0 || this.linesToClear.cols.length > 0) && this.dragState.isDragging) {
      this.ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
      this.linesToClear.rows.forEach(row => {
        this.ctx.fillRect(
          this.config.gridOffsetX,
          this.config.gridOffsetY + row * this.config.cellSize,
          this.config.cellSize * BOARD_SIZE,
          this.config.cellSize
        );
      });
      this.linesToClear.cols.forEach(col => {
        this.ctx.fillRect(
          this.config.gridOffsetX + col * this.config.cellSize,
          this.config.gridOffsetY,
          this.config.cellSize,
          this.config.cellSize * BOARD_SIZE
        );
      });
    }

    // Draw line clear animation
    if (this.animatingLines) {
      const elapsed = Date.now() - this.animatingLines.startTime;
      const progress = elapsed / 500;
      const alpha = 1 - progress;
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.animatingLines.rows.forEach(row => {
        this.ctx.fillRect(
          this.config.gridOffsetX,
          this.config.gridOffsetY + row * this.config.cellSize,
          this.config.cellSize * BOARD_SIZE,
          this.config.cellSize
        );
      });
      this.animatingLines.cols.forEach(col => {
        this.ctx.fillRect(
          this.config.gridOffsetX + col * this.config.cellSize,
          this.config.gridOffsetY,
          this.config.cellSize,
          this.config.cellSize * BOARD_SIZE
        );
      });
    }

    drawScore(this.ctx, this.state, this.config);
    if (this.state.status === 'playing' && this.state.shapes.length > 0) {
      drawShapes(this.ctx, this.state.shapes, this.config, 0.7);
    }
    if (this.dragState.isDragging && this.dragState.shape) {
      // Draw shape following finger at 1.0x scale, offset 3 blocks above finger
      const offsetY = 3 * this.config.cellSize;
      this.dragState.shape.cells.forEach(([row, col]: [number, number]) => {
        const x = this.dragState.currentX - this.config.cellSize / 2 + col * this.config.cellSize;
        const y = this.dragState.currentY - this.config.cellSize / 2 + row * this.config.cellSize - offsetY;
        this.ctx.fillStyle = COLORS[this.dragState.shape!.color - 1];
        this.ctx.fillRect(x, y, this.config.cellSize - 2, this.config.cellSize - 2);
      });
      // Draw preview on grid if valid
      if (this.dragState.previewRow >= 0 && this.dragState.isValidPlacement) {
        this.dragState.shape.cells.forEach(([row, col]: [number, number]) => {
          drawCell(this.ctx, this.dragState.previewRow + row, this.dragState.previewCol + col, this.dragState.shape!.color, this.config, 0.5);
        });
      }
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
