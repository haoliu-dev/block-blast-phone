# Block Blast 游戏设计文档

**版本**: 1.0  
**日期**: 2026-02-16  
**项目**: Block Blast (方块消除)

---

## 1. 概述

本文档定义 Block Blast 游戏的完整技术设计。本游戏是一款移动端优先的方块拼图益智游戏，玩家通过拖拽方块形状到 8x8 网格上进行消除得分。

## 2. 技术架构

### 2.1 技术栈

| 组件 | 技术选择 |
|------|----------|
| 运行时 | Bun |
| 语言 | TypeScript (strict mode) |
| 渲染 | HTML5 Canvas |
| 状态管理 | 函数式状态机（不可变状态） |
| 测试 | Bun (单元测试) + Playwright (E2E) |

### 2.2 核心约束

- **禁止使用 `any`**: 所有类型必须显式定义
- **模块化**: 游戏逻辑必须与渲染层解耦
- **data-testid**: 所有交互元素必须添加测试标识

## 3. 数据结构

### 3.1 游戏状态

```typescript
interface GameState {
  board: number[][];      // 8x8 网格，0=空，1+=颜色ID
  shapes: Shape[];        // 当前可用的3个形状
  score: number;          // 当前分数
  linesCleared: number;   // 消除总行数
  status: 'idle' | 'playing' | 'paused' | 'gameover';
  highScore: number;
}
```

### 3.2 棋盘表示

- 使用 `number[][]` 二维数组
- `board[row][col]`，`(0,0)` 为左上角
- 0 表示空，1+ 表示方块颜色 ID

### 3.3 形状表示

```typescript
type Shape = {
  id: string;
  cells: [number, number][];  // 坐标数组，如 [[0,0], [0,1], [1,0], [1,1]]
  color: number;               // 颜色ID
};
```

## 4. 模块设计

### 4.1 项目结构

```
src/
├── logic/              # 游戏逻辑（纯函数，可单元测试）
│   ├── types.ts       # 类型定义
│   ├── shapes.ts      # 形状定义和生成
│   ├── state.ts       # 初始状态
│   ├── actions.ts     # 动作定义
│   ├── reducer.ts     # 状态机 reducer
│   ├── scoring.ts     # 得分计算
│   └── gameover.ts    # 游戏结束检测
├── renderer/           # Canvas 渲染层
│   ├── canvas.ts      # Canvas 初始化和主循环
│   ├── draw.ts        # 绘制函数
│   └── input.ts       # 触屏/鼠标事件处理
├── audio/              # 音效
│   └── sounds.ts      # 音效管理
├── storage/            # 数据持久化
│   └── localStorage.ts
└── index.ts           # 入口文件
tests/
├── e2e/               # Playwright E2E 测试
│   └── game.spec.ts
└── logic/             # 单元测试
    └── reducer.test.ts
```

### 4.2 逻辑层（纯函数）

所有游戏逻辑都是纯函数：

- `createShape()`: 生成随机形状
- `canPlace(board, shape, row, col)`: 检查形状能否放置
- `placeShape(state, shape, row, col)`: 放置形状，返回新状态
- `checkLines(board)`: 检查并消除满行
- `calculateScore(lines, blocksPlaced)`: 计算得分
- `checkGameOver(board, shapes)`: 检查是否游戏结束

### 4.3 渲染层

- `initCanvas()`: 初始化 Canvas
- `render(state)`: 全量重绘
- `drawBoard(board)`: 绘制网格
- `drawShape(shape, x, y)`: 绘制形状
- `drawPreview(shape, row, col, isValid)`: 绘制预览

### 4.4 输入处理

使用 Pointer Events 统一处理：

```typescript
element.addEventListener('pointerdown', onPointerDown);
element.addEventListener('pointermove', onPointerMove);
element.addEventListener('pointerup', onPointerUp);
```

拖拽流程：
1. `pointerdown`: 选中形状，开始拖拽
2. `pointermove`: 更新预览位置，渲染层独立处理
3. `pointerup`: 判断放置是否有效
   - 有效: dispatch `placeShape` action
   - 无效: 播放失败音效 + 红色闪烁动画，形状弹回

## 5. 音效设计

### 5.1 音效类型

| 事件 | 音效描述 |
|------|----------|
| 放置成功 | 清脆的"咔哒"声 |
| 放置失败 | 低沉的"咚"声 |
| 消除行 | 愉悦的音阶（行数越多音阶越高） |
| 连击 | 额外奖励音效 |
| 游戏结束 | 淡出音乐 + 结果提示音 |

### 5.2 实现

- 使用 Web Audio API
- 懒加载音频文件
- 设置中提供静音选项

## 6. 触屏交互

### 6.1 事件处理

- 使用 `pointerdown/move/up` 统一处理触屏和鼠标
- CSS `touch-action: none` 防止默认行为
- `user-select: none` 防止选中文本

### 6.2 拖拽行为

- 拖拽时形状跟随手指/光标
- 网格上显示幽灵预览（绿色=有效，红色=无效）
- 释放时吸附到最近的有效网格位置

### 6.3 失败反馈

- **视觉**: 红色闪烁 + 弹回原位动画
- **音效**: 与成功放置明显不同的"咚"声

## 7. 测试策略

### 7.1 单元测试 (`src/**/*.test.ts`)

直接测试 reducer 纯函数：

```typescript
test('placeShape adds blocks to board', () => {
  const state = createInitialState();
  const shape = createShape('square');
  const newState = reducer(state, placeShape(shape, 0, 0));
  expect(newState.board[0][0]).toBe(shape.color);
});
```

### 7.2 E2E 测试 (`tests/e2e/*.spec.ts`)

Playwright 模拟移动端：

```typescript
test('complete a line and score', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 }); // iPhone 14
  // 模拟拖拽放置...
});
```

## 8. 验收标准

- [ ] 游戏棋盘正确渲染为 8x8 网格
- [ ] 生成区出现 3 个随机形状
- [ ] 形状可以拖放到网格上
- [ ] 无效放置被拒绝并有红色闪烁 + 音效反馈
- [ ] 完成的行/列会被消除
- [ ] 分数根据放置和消除正确更新
- [ ] 无法移动时触发游戏结束
- [ ] 游戏可以重新开始
- [ ] 触屏拖拽流畅，无意外滚动
- [ ] 禁用缩放和双击缩放
- [ ] 60 FPS 性能
- [ ] 最高分正确保存和读取

## 9. 后续计划

1. 实现游戏逻辑层（纯函数）
2. 实现渲染层（Canvas）
3. 实现触屏交互
4. 添加音效
5. 编写单元测试
6. 编写 E2E 测试
7. 验证所有验收标准
