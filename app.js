const COLS = 10;
const ROWS = 20;
const PREVIEW_COUNT = 3;
const STORAGE_KEY = "tetromino-pocket-best";

const COLORS = {
  I: "#25d0ff",
  J: "#5b7cfa",
  L: "#ff9f43",
  O: "#ffcc4d",
  S: "#55d187",
  T: "#bd7bff",
  Z: "#ff5c7a",
};

const SHAPES = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
};

const canvas = document.querySelector("#board");
const ctx = canvas.getContext("2d");
const nextCanvas = document.querySelector("#next");
const nextCtx = nextCanvas.getContext("2d");
const holdCanvas = document.querySelector("#hold");
const holdCtx = holdCanvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const bestEl = document.querySelector("#best");
const levelEl = document.querySelector("#level");
const linesEl = document.querySelector("#lines");
const overlay = document.querySelector("#overlay");
const overlayTitle = document.querySelector("#overlayTitle");
const overlayHint = document.querySelector("#overlayHint");

const buttons = {
  left: document.querySelector("#leftBtn"),
  right: document.querySelector("#rightBtn"),
  down: document.querySelector("#downBtn"),
  rotate: document.querySelector("#rotateBtn"),
  drop: document.querySelector("#dropBtn"),
  hold: document.querySelector("#holdBtn"),
  pause: document.querySelector("#pauseBtn"),
  restart: document.querySelector("#restartBtn"),
};

const state = {
  board: createBoard(),
  active: null,
  hold: null,
  canHold: true,
  queue: [],
  score: 0,
  best: Number(localStorage.getItem(STORAGE_KEY) || 0),
  level: 1,
  lines: 0,
  dropCounter: 0,
  dropInterval: 920,
  lastTime: 0,
  running: false,
  paused: false,
  gameOver: false,
};

bestEl.textContent = formatNumber(state.best);
resizeCanvases();
draw();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  });
}

window.addEventListener("resize", () => {
  resizeCanvases();
  draw();
});

overlay.addEventListener("click", () => {
  if (!state.running || state.gameOver) startGame();
  else togglePause(false);
});

buttons.restart.addEventListener("click", startGame);
buttons.pause.addEventListener("click", () => togglePause());
bindTap(buttons.left, () => move(-1), true);
bindTap(buttons.right, () => move(1), true);
bindTap(buttons.down, softDrop, true);
bindTap(buttons.rotate, rotateActive);
bindTap(buttons.drop, hardDrop);
bindTap(buttons.hold, holdActive);

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["arrowleft", "arrowright", "arrowdown", "arrowup", " ", "c", "p", "r"].includes(key)) {
    event.preventDefault();
  }

  if (key === "arrowleft") move(-1);
  if (key === "arrowright") move(1);
  if (key === "arrowdown") softDrop();
  if (key === "arrowup" || key === "x") rotateActive();
  if (key === " ") hardDrop();
  if (key === "c") holdActive();
  if (key === "p") togglePause();
  if (key === "r") startGame();
});

let pointerStart = null;
canvas.addEventListener("pointerdown", (event) => {
  pointerStart = { x: event.clientX, y: event.clientY, t: performance.now() };
});

canvas.addEventListener("pointerup", (event) => {
  if (!pointerStart) return;
  const dx = event.clientX - pointerStart.x;
  const dy = event.clientY - pointerStart.y;
  const elapsed = performance.now() - pointerStart.t;
  pointerStart = null;

  if (!state.running || state.paused || state.gameOver) {
    startGame();
    return;
  }

  if (Math.abs(dx) < 18 && Math.abs(dy) < 18 && elapsed < 260) {
    rotateActive();
    return;
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    move(dx > 0 ? 1 : -1);
  } else if (dy > 24) {
    softDrop();
  } else if (dy < -28) {
    hardDrop();
  }
});

function startGame() {
  state.board = createBoard();
  state.active = null;
  state.hold = null;
  state.canHold = true;
  state.queue = [];
  state.score = 0;
  state.level = 1;
  state.lines = 0;
  state.dropCounter = 0;
  state.dropInterval = 920;
  state.lastTime = 0;
  state.running = true;
  state.paused = false;
  state.gameOver = false;
  refillQueue();
  spawnPiece();
  updateHud();
  hideOverlay();
  requestAnimationFrame(update);
}

function update(time = 0) {
  if (!state.running || state.paused || state.gameOver) return;

  const delta = time - state.lastTime;
  state.lastTime = time;
  state.dropCounter += delta;

  if (state.dropCounter > state.dropInterval) {
    dropOne();
  }

  draw();
  requestAnimationFrame(update);
}

function createBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

function refillQueue() {
  while (state.queue.length < PREVIEW_COUNT + 1) {
    const bag = Object.keys(SHAPES);
    for (let i = bag.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    state.queue.push(...bag);
  }
}

function spawnPiece(kind = state.queue.shift()) {
  refillQueue();
  state.active = {
    kind,
    matrix: cloneMatrix(SHAPES[kind]),
    x: Math.floor(COLS / 2) - Math.ceil(SHAPES[kind].length / 2),
    y: kind === "I" ? -1 : 0,
  };
  state.canHold = true;

  if (collides(state.active)) {
    finishGame();
  }
}

function cloneMatrix(matrix) {
  return matrix.map((row) => [...row]);
}

function move(dir) {
  if (!canPlay()) return;
  state.active.x += dir;
  if (collides(state.active)) state.active.x -= dir;
  draw();
}

function softDrop() {
  if (!canPlay()) return;
  if (dropOne()) {
    addScore(1);
  }
}

function dropOne() {
  if (!canPlay()) return false;
  state.active.y += 1;
  if (collides(state.active)) {
    state.active.y -= 1;
    lockPiece();
    return false;
  }
  state.dropCounter = 0;
  return true;
}

function hardDrop() {
  if (!canPlay()) return;
  let distance = 0;
  while (!collides({ ...state.active, y: state.active.y + 1 })) {
    state.active.y += 1;
    distance += 1;
  }
  addScore(distance * 2);
  lockPiece();
  draw();
}

function rotateActive() {
  if (!canPlay()) return;
  const original = state.active.matrix;
  const rotated = rotateMatrix(original);
  state.active.matrix = rotated;

  const kicks = state.active.kind === "I" ? [0, -2, 2, -1, 1] : [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    state.active.x += kick;
    if (!collides(state.active)) {
      draw();
      return;
    }
    state.active.x -= kick;
  }
  state.active.matrix = original;
}

function rotateMatrix(matrix) {
  const size = matrix.length;
  const next = Array.from({ length: size }, () => Array(size).fill(0));
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      next[x][size - 1 - y] = matrix[y][x];
    }
  }
  return next;
}

function holdActive() {
  if (!canPlay() || !state.canHold) return;
  const current = state.active.kind;
  if (state.hold) {
    const nextHold = state.hold;
    state.hold = current;
    spawnPiece(nextHold);
  } else {
    state.hold = current;
    spawnPiece();
  }
  state.canHold = false;
  draw();
}

function lockPiece() {
  forEachCell(state.active, (x, y) => {
    if (y >= 0) state.board[y][x] = state.active.kind;
  });

  const cleared = clearLines();
  if (cleared) {
    const points = [0, 100, 300, 500, 800][cleared] * state.level;
    addScore(points);
    state.lines += cleared;
    state.level = Math.floor(state.lines / 10) + 1;
    state.dropInterval = Math.max(110, 920 - (state.level - 1) * 72);
  }

  spawnPiece();
  updateHud();
}

function clearLines() {
  let cleared = 0;
  for (let y = ROWS - 1; y >= 0; y -= 1) {
    if (state.board[y].every(Boolean)) {
      state.board.splice(y, 1);
      state.board.unshift(Array(COLS).fill(null));
      cleared += 1;
      y += 1;
    }
  }
  return cleared;
}

function collides(piece) {
  let hit = false;
  forEachCell(piece, (x, y) => {
    if (x < 0 || x >= COLS || y >= ROWS || (y >= 0 && state.board[y][x])) {
      hit = true;
    }
  });
  return hit;
}

function forEachCell(piece, callback) {
  piece.matrix.forEach((row, py) => {
    row.forEach((value, px) => {
      if (value) callback(piece.x + px, piece.y + py);
    });
  });
}

function addScore(amount) {
  state.score += amount;
  if (state.score > state.best) {
    state.best = state.score;
    localStorage.setItem(STORAGE_KEY, String(state.best));
  }
  updateHud();
}

function togglePause(force) {
  if (!state.running || state.gameOver) return;
  state.paused = typeof force === "boolean" ? force : !state.paused;
  if (state.paused) {
    showOverlay("已暫停", "點一下繼續");
  } else {
    hideOverlay();
    state.lastTime = performance.now();
    requestAnimationFrame(update);
  }
}

function finishGame() {
  state.running = false;
  state.gameOver = true;
  updateHud();
  draw();
  showOverlay("遊戲結束", "點一下重新開始");
}

function canPlay() {
  return state.running && !state.paused && !state.gameOver && state.active;
}

function updateHud() {
  scoreEl.textContent = formatNumber(state.score);
  bestEl.textContent = formatNumber(state.best);
  levelEl.textContent = String(state.level);
  linesEl.textContent = String(state.lines);
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-Hant").format(value);
}

function resizeCanvases() {
  scaleCanvas(canvas, COLS, ROWS);
  scaleCanvas(nextCanvas, 4, 8);
  scaleCanvas(holdCanvas, 4, 4);
}

function scaleCanvas(target, logicalCols, logicalRows) {
  const rect = target.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round((rect.width * logicalRows * ratio) / logicalCols));
  target.width = width;
  target.height = height;
}

function draw() {
  drawBoard();
  drawPreview(nextCtx, state.queue.slice(0, PREVIEW_COUNT), nextCanvas);
  drawPreview(holdCtx, state.hold ? [state.hold] : [], holdCanvas);
}

function drawBoard() {
  const cell = canvas.width / COLS;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#090d13";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(ctx, cell, COLS, ROWS);

  state.board.forEach((row, y) => {
    row.forEach((kind, x) => {
      if (kind) drawBlock(ctx, x * cell, y * cell, cell, COLORS[kind]);
    });
  });

  if (state.active) {
    const ghost = getGhostPiece();
    drawPiece(ctx, ghost, cell, true);
    drawPiece(ctx, state.active, cell, false);
  }
}

function drawGrid(target, cell, cols, rows) {
  target.strokeStyle = "rgba(255, 255, 255, 0.055)";
  target.lineWidth = Math.max(1, cell * 0.025);
  for (let x = 1; x < cols; x += 1) {
    target.beginPath();
    target.moveTo(x * cell, 0);
    target.lineTo(x * cell, rows * cell);
    target.stroke();
  }
  for (let y = 1; y < rows; y += 1) {
    target.beginPath();
    target.moveTo(0, y * cell);
    target.lineTo(cols * cell, y * cell);
    target.stroke();
  }
}

function drawPiece(target, piece, cell, ghost) {
  forEachCell(piece, (x, y) => {
    if (y < 0) return;
    drawBlock(target, x * cell, y * cell, cell, COLORS[piece.kind], ghost);
  });
}

function drawBlock(target, x, y, size, color, ghost = false) {
  const pad = Math.max(1, size * 0.075);
  const blockSize = size - pad * 2;
  target.save();
  target.globalAlpha = ghost ? 0.25 : 1;
  target.fillStyle = color;
  target.fillRect(x + pad, y + pad, blockSize, blockSize);
  target.fillStyle = "rgba(255, 255, 255, 0.22)";
  target.fillRect(x + pad, y + pad, blockSize, Math.max(1, size * 0.16));
  target.strokeStyle = "rgba(0, 0, 0, 0.28)";
  target.lineWidth = Math.max(1, size * 0.045);
  target.strokeRect(x + pad, y + pad, blockSize, blockSize);
  target.restore();
}

function drawPreview(target, pieces, targetCanvas) {
  target.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  target.fillStyle = "rgba(9, 13, 19, 0.42)";
  target.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
  const cell = targetCanvas.width / 4;

  pieces.forEach((kind, index) => {
    const matrix = SHAPES[kind];
    const bounds = matrixBounds(matrix);
    const offsetX = (4 - bounds.width) / 2 - bounds.minX;
    const offsetY = index * 2.55 + (2.2 - bounds.height) / 2 - bounds.minY;
    matrix.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          drawBlock(target, (x + offsetX) * cell, (y + offsetY) * cell, cell, COLORS[kind]);
        }
      });
    });
  });
}

function matrixBounds(matrix) {
  const cells = [];
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) cells.push({ x, y });
    });
  });
  const xs = cells.map((cell) => cell.x);
  const ys = cells.map((cell) => cell.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  return { minX, minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

function getGhostPiece() {
  const ghost = {
    ...state.active,
    matrix: state.active.matrix,
  };
  while (!collides({ ...ghost, y: ghost.y + 1 })) {
    ghost.y += 1;
  }
  return ghost;
}

function showOverlay(title, hint) {
  overlayTitle.textContent = title;
  overlayHint.textContent = hint;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function bindTap(element, action, repeat = false) {
  let timer = null;
  let interval = null;

  const clear = () => {
    element.classList.remove("is-pressed");
    window.clearTimeout(timer);
    window.clearInterval(interval);
    timer = null;
    interval = null;
  };

  element.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    element.setPointerCapture(event.pointerId);
    element.classList.add("is-pressed");
    action();
    if (repeat) {
      timer = window.setTimeout(() => {
        interval = window.setInterval(action, 72);
      }, 190);
    }
  });

  element.addEventListener("pointerup", clear);
  element.addEventListener("pointercancel", clear);
  element.addEventListener("lostpointercapture", clear);
}
