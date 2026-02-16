import { GameRenderer } from './renderer/index';
import { soundManager } from './audio/sounds';

function init(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }
  new GameRenderer(canvas);
  canvas.addEventListener('touchstart', () => soundManager.init(), { once: true });
  canvas.addEventListener('click', () => soundManager.init(), { once: true });
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', init);
}
