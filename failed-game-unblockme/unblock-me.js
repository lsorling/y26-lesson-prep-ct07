const GRID_SIZE = 6;
const BOARD_SIZE = 400;
const CELL_SIZE = BOARD_SIZE / GRID_SIZE;
const BOARD_X = 38;
const BOARD_Y = 150;
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 700;
const EXIT_ROW = 2;
const ACTION_BUTTON = { x: 535, y: 545, width: 260, height: 54 };

const LEVELS = [
  {
    moveLimit: 12,
    blocks: [
      { id: 'target', row: 2, col: 0, length: 2, axis: 'horizontal', color: '#ff5964' },
      { id: 'blocker', row: 1, col: 2, length: 2, axis: 'vertical', color: '#55c1ff' },
      { id: 'long-block', row: 4, col: 0, length: 2, axis: 'horizontal', color: '#ffd166' },
      { id: 'corner-block', row: 4, col: 5, length: 2, axis: 'vertical', color: '#8bd17c' }
    ]
  },
  {
    moveLimit: 12,
    blocks: [
      { id: 'target', row: 2, col: 0, length: 2, axis: 'horizontal', color: '#ff5964' },
      { id: 'blocker', row: 0, col: 2, length: 3, axis: 'vertical', color: '#55c1ff' },
      { id: 'top-block', row: 0, col: 4, length: 2, axis: 'horizontal', color: '#ffd166' },
      { id: 'right-block', row: 3, col: 5, length: 2, axis: 'vertical', color: '#8bd17c' },
      { id: 'bottom-block', row: 4, col: 0, length: 2, axis: 'horizontal', color: '#bd93f9' }
    ]
  },
  {
    moveLimit: 12,
    blocks: [
      { id: 'target', row: 2, col: 0, length: 2, axis: 'horizontal', color: '#ff5964' },
      { id: 'blocker', row: 2, col: 2, length: 2, axis: 'vertical', color: '#55c1ff' },
      { id: 'top-block', row: 0, col: 0, length: 2, axis: 'horizontal', color: '#ffd166' },
      { id: 'tall-block', row: 0, col: 4, length: 2, axis: 'vertical', color: '#8bd17c' },
      { id: 'bottom-block', row: 4, col: 3, length: 2, axis: 'horizontal', color: '#bd93f9' }
    ]
  },
  {
    moveLimit: 14,
    blocks: [
      { id: 'target', row: 2, col: 0, length: 2, axis: 'horizontal', color: '#ff5964' },
      { id: 'left-blocker', row: 1, col: 2, length: 2, axis: 'vertical', color: '#55c1ff' },
      { id: 'middle-blocker', row: 2, col: 4, length: 2, axis: 'vertical', color: '#ffd166' },
      { id: 'right-blocker', row: 2, col: 5, length: 2, axis: 'vertical', color: '#8bd17c' },
      { id: 'bottom-block', row: 4, col: 0, length: 2, axis: 'horizontal', color: '#bd93f9' }
    ]
  },
  {
    moveLimit: 16,
    blocks: [
      { id: 'target', row: 2, col: 0, length: 2, axis: 'horizontal', color: '#ff5964' },
      { id: 'left-blocker', row: 2, col: 2, length: 2, axis: 'vertical', color: '#55c1ff' },
      { id: 'middle-blocker', row: 2, col: 4, length: 2, axis: 'vertical', color: '#ffd166' },
      { id: 'right-blocker', row: 1, col: 5, length: 3, axis: 'vertical', color: '#8bd17c' },
      { id: 'top-block', row: 0, col: 0, length: 3, axis: 'horizontal', color: '#bd93f9' },
      { id: 'bottom-block', row: 4, col: 0, length: 2, axis: 'horizontal', color: '#ffa94d' }
    ]
  }
];

let blocks = [];
let selectedBlock = null;
let currentLevel = 0;
let movesUsed = 0;
let gamePhase = 'playing';
let gameStartedAt = 0;
let gameFinishedAt = null;
let dragStartX = 0;
let dragStartY = 0;
let canvasElement;

function setup() {
  new Canvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  canvasElement = document.querySelector('#defaultCanvas0');
  document.querySelector('#game-container').appendChild(canvasElement);

  gameStartedAt = millis();
  loadLevel(currentLevel);
}

function update() {
  background('#fff5d6');
  drawBoard();
  drawInterface();
}

function loadLevel(levelIndex) {
  selectedBlock = null;
  blocks = LEVELS[levelIndex].blocks.map(definition => ({ ...definition }));
}

function drawBoard() {
  noStroke();
  fill('#f7dca3');
  rect(BOARD_X - 4, BOARD_Y - 4, BOARD_SIZE + 8, BOARD_SIZE + 8, 14);

  fill('#fffaf0');
  rect(BOARD_X, BOARD_Y, BOARD_SIZE, BOARD_SIZE, 10);

  stroke('#e8c98d');
  strokeWeight(2);
  for (let cell = 1; cell < GRID_SIZE; cell += 1) {
    const linePosition = cell * CELL_SIZE;
    line(BOARD_X + linePosition, BOARD_Y, BOARD_X + linePosition, BOARD_Y + BOARD_SIZE);
    line(BOARD_X, BOARD_Y + linePosition, BOARD_X + BOARD_SIZE, BOARD_Y + linePosition);
  }

  drawBlocks();

  noStroke();
  fill('#8bd17c');
  rect(BOARD_X + BOARD_SIZE - 3, BOARD_Y + EXIT_ROW * CELL_SIZE + 10, 28, CELL_SIZE - 20, 8);
  fill('#356b45');
  textAlign(CENTER, CENTER);
  textSize(22);
  text('➜', BOARD_X + BOARD_SIZE + 10, BOARD_Y + (EXIT_ROW + 0.5) * CELL_SIZE);
}

function drawBlocks() {
  for (const block of blocks) {
    const isHorizontal = block.axis === 'horizontal';
    const x = BOARD_X + block.col * CELL_SIZE + 4;
    const y = BOARD_Y + block.row * CELL_SIZE + 4;
    const width = (isHorizontal ? block.length : 1) * CELL_SIZE - 8;
    const height = (isHorizontal ? 1 : block.length) * CELL_SIZE - 8;

    stroke(block === selectedBlock || pointIsInsideBlock(block, mouseX, mouseY) ? '#382c3b' : '#806c6c');
    strokeWeight(3);
    fill(block.color);
    rect(x, y, width, height, 12);

    noStroke();
    fill(255, 255, 255, 85);
    rect(x + 7, y + 6, Math.max(12, width - 14), 7, 4);
  }
}

function drawInterface() {
  noStroke();
  fill('#382c3b');
  textAlign(LEFT, TOP);
  textSize(25);
  text('LEVEL ' + (currentLevel + 1) + ' / ' + LEVELS.length, 535, 42);

  textSize(17);
  fill('#554858');
  text('Free the red block and slide it', 535, 91);
  text('through the exit on the right!', 535, 116);

  textSize(19);
  fill('#382c3b');
  text('Time: ' + formatTime(getElapsedSeconds()), 535, 185);
  text('Moves: ' + movesUsed + ' / ' + LEVELS[currentLevel].moveLimit, 535, 223);

  textSize(16);
  fill('#554858');
  text('How to play', 535, 280);
  textSize(14);
  text('Drag a block along its groove, or', 535, 312);
  text('click it and use the arrow keys.', 535, 334);
  text('Blocks cannot pass through each', 535, 365);
  text('other. Clear the red block’s row.', 535, 387);
  text('Stay within the move limit to win!', 535, 418);

  if (selectedBlock && gamePhase === 'playing') {
    textSize(14);
    fill('#765d79');
    text('Selected: ' + (selectedBlock.id === 'target' ? 'Red block' : selectedBlock.id), 535, 467);
  }

  if (gamePhase === 'level-cleared') {
    drawMessage('Exit cleared!', 'Nice sliding! Continue to the next puzzle.');
  } else if (gamePhase === 'won') {
    drawMessage('You did it!', 'All five puzzles solved in ' + formatTime(getElapsedSeconds()) + '!');
  } else if (gamePhase === 'lost') {
    drawMessage('Out of moves!', 'Restart and try a different sliding plan.');
  }

  drawActionButton();
}

function drawMessage(title, subtitle) {
  fill('#382c3b');
  textAlign(LEFT, TOP);
  textSize(19);
  text(title, 535, 490);
  textSize(13);
  text(subtitle, 535, 516);
}

function drawActionButton() {
  const buttonLabel = gamePhase === 'level-cleared' ? 'Continue' :
    gamePhase === 'playing' ? 'Restart game' : 'Play again';
  noStroke();
  fill('#6d4c7d');
  rect(ACTION_BUTTON.x, ACTION_BUTTON.y, ACTION_BUTTON.width, ACTION_BUTTON.height, 12);
  fill('#ffffff');
  textAlign(CENTER, CENTER);
  textSize(18);
  text(buttonLabel, ACTION_BUTTON.x + ACTION_BUTTON.width / 2, ACTION_BUTTON.y + ACTION_BUTTON.height / 2);
}

function mousePressed() {
  if (isInsideActionButton(mouseX, mouseY)) {
    if (gamePhase === 'level-cleared') {
      currentLevel += 1;
      movesUsed = 0;
      gamePhase = 'playing';
      loadLevel(currentLevel);
    } else {
      restartGame();
    }
    return false;
  }

  if (gamePhase !== 'playing') return false;

  selectedBlock = findBlockAt(mouseX, mouseY);
  if (selectedBlock) {
    dragStartX = mouseX;
    dragStartY = mouseY;
  }
  return false;
}

function mouseReleased() {
  if (!selectedBlock || gamePhase !== 'playing') return false;

  const dragDistance = selectedBlock.axis === 'horizontal' ? mouseX - dragStartX : mouseY - dragStartY;
  const requestedSteps = Math.round(dragDistance / CELL_SIZE);
  if (requestedSteps !== 0) {
    slideBlock(selectedBlock, Math.sign(requestedSteps), Math.abs(requestedSteps));
  }
  return false;
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    restartGame();
    return false;
  }
  if (gamePhase !== 'playing' || !selectedBlock) return false;

  const horizontalDirection = keyCode === LEFT_ARROW ? -1 : keyCode === RIGHT_ARROW ? 1 : 0;
  const verticalDirection = keyCode === UP_ARROW ? -1 : keyCode === DOWN_ARROW ? 1 : 0;
  const direction = selectedBlock.axis === 'horizontal' ? horizontalDirection : verticalDirection;
  if (direction !== 0) slideBlock(selectedBlock, direction, 1);
  return false;
}

function slideBlock(block, direction, requestedSteps) {
  const positionName = block.axis === 'horizontal' ? 'col' : 'row';
  let distanceMoved = 0;

  for (let step = 0; step < requestedSteps; step += 1) {
    const nextPosition = block[positionName] + direction;
    if (!canOccupyPosition(block, nextPosition)) break;
    block[positionName] = nextPosition;
    distanceMoved += 1;
  }

  if (distanceMoved === 0) return;

  movesUsed += 1;

  const targetBlockReachedExit = block.id === 'target' &&
    block.row === EXIT_ROW &&
    block.col + block.length === GRID_SIZE;

  if (targetBlockReachedExit) {
    gamePhase = currentLevel === LEVELS.length - 1 ? 'won' : 'level-cleared';
    if (gamePhase === 'won') gameFinishedAt = millis();
  } else if (movesUsed >= LEVELS[currentLevel].moveLimit) {
    gamePhase = 'lost';
    gameFinishedAt = millis();
  }
}

function canOccupyPosition(block, nextPosition) {
  if (nextPosition < 0 || nextPosition + block.length > GRID_SIZE) return false;

  const nextRow = block.axis === 'vertical' ? nextPosition : block.row;
  const nextCol = block.axis === 'horizontal' ? nextPosition : block.col;

  for (let offset = 0; offset < block.length; offset += 1) {
    const row = nextRow + (block.axis === 'vertical' ? offset : 0);
    const col = nextCol + (block.axis === 'horizontal' ? offset : 0);
    if (blocks.some(other => other !== block && occupiesCell(other, row, col))) return false;
  }
  return true;
}

function occupiesCell(block, row, col) {
  if (block.axis === 'horizontal') {
    return row === block.row && col >= block.col && col < block.col + block.length;
  }
  return col === block.col && row >= block.row && row < block.row + block.length;
}

function findBlockAt(x, y) {
  for (let index = blocks.length - 1; index >= 0; index -= 1) {
    if (pointIsInsideBlock(blocks[index], x, y)) return blocks[index];
  }
  return null;
}

function pointIsInsideBlock(block, x, y) {
  const blockWidth = (block.axis === 'horizontal' ? block.length : 1) * CELL_SIZE - 8;
  const blockHeight = (block.axis === 'vertical' ? block.length : 1) * CELL_SIZE - 8;
  const centerX = BOARD_X + (block.col + (block.axis === 'horizontal' ? block.length / 2 : 0.5)) * CELL_SIZE;
  const centerY = BOARD_Y + (block.row + (block.axis === 'vertical' ? block.length / 2 : 0.5)) * CELL_SIZE;
  return x >= centerX - blockWidth / 2 && x <= centerX + blockWidth / 2 &&
    y >= centerY - blockHeight / 2 && y <= centerY + blockHeight / 2;
}

function isInsideActionButton(x, y) {
  return x >= ACTION_BUTTON.x && x <= ACTION_BUTTON.x + ACTION_BUTTON.width &&
    y >= ACTION_BUTTON.y && y <= ACTION_BUTTON.y + ACTION_BUTTON.height;
}

function restartGame() {
  currentLevel = 0;
  movesUsed = 0;
  gamePhase = 'playing';
  gameStartedAt = millis();
  gameFinishedAt = null;
  loadLevel(currentLevel);
}

function getElapsedSeconds() {
  const endTime = gameFinishedAt === null ? millis() : gameFinishedAt;
  return Math.floor((endTime - gameStartedAt) / 1000);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return minutes + ':' + seconds;
}
