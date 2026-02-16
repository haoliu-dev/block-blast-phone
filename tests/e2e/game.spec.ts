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
