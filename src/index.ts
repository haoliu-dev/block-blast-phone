import { GameRenderer } from './renderer/index';
import { soundManager } from './audio/sounds';

let bgMusicOn = false;

function init(): void {
  const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }
  new GameRenderer(canvas);
  canvas.addEventListener('touchstart', () => soundManager.init().catch(console.error), { once: true });
  canvas.addEventListener('click', () => soundManager.init().catch(console.error), { once: true });
  
  // Keyboard shortcut to toggle background music (M key)
  window.addEventListener('keydown', async (e) => {
    if (e.key === 'm' || e.key === 'M') {
      if (!soundManager) return;
      await soundManager.init();
      bgMusicOn = !bgMusicOn;
      soundManager.setBgMusicEnabled(bgMusicOn);
    }
  });
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', init);
}
