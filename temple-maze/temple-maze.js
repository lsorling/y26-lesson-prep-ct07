const TILE_SIZE = 36;
const MAZE_LAYOUT = [
  '#################',
  '#.......#.......#',
  '#.......#.......#',
  '#...............#',
  '###.#####.#####.#',
  '#.......#.......#',
  '#.......#.......#',
  '#...............#',
  '#.#####.#####.###',
  '#.......#.......#',
  '#.......#.......#',
  '#...............#',
  '#################'
];

const GEM_TILES = [
  { column: 5, row: 1 },
  { column: 13, row: 1 },
  { column: 3, row: 5 },
  { column: 13, row: 5 },
  { column: 8, row: 3 }
];
const EXIT_TILE = { column: 15, row: 11 };
const GUARD_ROUTE = [
  { column: 2, row: 7 },
  { column: 14, row: 7 }
];
const HUD_HEIGHT = 80;

let walls;
let gems;
let player;
let guard;
let collectedCount = 0;
let guardTargetIndex = 1;
let gameState = 'ready';
let notice = '';

function setup() {
  new Canvas(MAZE_LAYOUT[0].length * TILE_SIZE, MAZE_LAYOUT.length * TILE_SIZE + HUD_HEIGHT);
  world.gravity.y = 0;
  textFont('monospace');
  createLevel();
}

function createLevel() {
  if (gems) gems.deleteAll();
  if (walls) walls.deleteAll();
  if (player) player.delete();
  if (guard) guard.delete();

  const wallTemplate = new Group();
  wallTemplate.w = TILE_SIZE;
  wallTemplate.h = TILE_SIZE;
  wallTemplate.collider = 'static';
  wallTemplate.color = '#514334';
  wallTemplate.stroke = '#806b4e';
  wallTemplate.tile = '#';
  walls = new Tiles(
    MAZE_LAYOUT,
    TILE_SIZE / 2,
    TILE_SIZE / 2,
    TILE_SIZE,
    TILE_SIZE
  );

  gems = new Group();
  gems.d = 20;
  gems.collider = 'static';
  gems.color = '#ffd84d';
  gems.stroke = '#fff2a6';

  for (const tile of GEM_TILES) {
    const gem = new gems.Sprite();
    gem.x = tileCenter(tile.column);
    gem.y = tileCenter(tile.row);
    gem.d = 20;
  }

  player = new Sprite(tileCenter(1), tileCenter(1), 22, 22);
  player.collider = 'dynamic';
  player.color = '#40d9ff';
  player.stroke = '#d5f8ff';
  player.rotationLock = true;

  const guardStart = GUARD_ROUTE[0];
  guard = new Sprite(tileCenter(guardStart.column), tileCenter(guardStart.row), 24, 24);
  guard.collider = 'dynamic';
  guard.color = '#e45d4d';
  guard.stroke = '#ffd1bd';
  guard.rotationLock = true;

  collectedCount = 0;
  guardTargetIndex = 1;
  notice = '';
}

function draw() {
  background('#171a1c');
  drawExit();
  drawHud();

  if (gameState === 'ready') {
    drawMessage('TEMPLE MAZE', 'Press Enter or Space to begin');
    return;
  }

  if (gameState !== 'playing') {
    drawMessage(
      gameState === 'won' ? 'TEMPLE ESCAPED!' : 'CAUGHT BY THE GUARD',
      'Press R to play again'
    );
    return;
  }

  movePlayer();
  moveGuard();
  player.collides(walls);
  guard.collides(walls);
  collectGems();
  checkGameEnd();
}

function tileCenter(tileIndex) {
  return TILE_SIZE / 2 + tileIndex * TILE_SIZE;
}

function movePlayer() {
  let horizontal = 0;
  let vertical = 0;

  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) horizontal -= 1;
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) horizontal += 1;
  if (keyIsDown(UP_ARROW) || keyIsDown(87)) vertical -= 1;
  if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) vertical += 1;

  const movementLength = Math.hypot(horizontal, vertical);
  const speed = 3.1;
  if (movementLength > 0) {
    horizontal /= movementLength;
    vertical /= movementLength;
  }

  player.vel.x = horizontal * speed;
  player.vel.y = vertical * speed;
}

function moveGuard() {
  const target = GUARD_ROUTE[guardTargetIndex];
  const targetX = tileCenter(target.column);
  const targetY = tileCenter(target.row);
  const offsetX = targetX - guard.x;
  const offsetY = targetY - guard.y;
  const distance = Math.hypot(offsetX, offsetY);

  if (distance < 4) {
    guardTargetIndex = (guardTargetIndex + 1) % GUARD_ROUTE.length;
    guard.vel.x = 0;
    guard.vel.y = 0;
    return;
  }

  const guardSpeed = 1.15;
  guard.vel.x = (offsetX / distance) * guardSpeed;
  guard.vel.y = (offsetY / distance) * guardSpeed;
}

function collectGems() {
  for (const gem of gems) {
    if (player.overlaps(gem)) {
      gem.delete();
      collectedCount += 1;
      notice = `Gem collected: ${collectedCount}/${GEM_TILES.length}`;
    }
  }
}

function checkGameEnd() {
  if (player.overlaps(guard)) {
    gameState = 'lost';
    player.vel.x = 0;
    player.vel.y = 0;
    guard.vel.x = 0;
    guard.vel.y = 0;
    return;
  }

  const exitX = tileCenter(EXIT_TILE.column);
  const exitY = tileCenter(EXIT_TILE.row);
  const reachedExit = Math.hypot(player.x - exitX, player.y - exitY) < TILE_SIZE * 0.45;

  if (reachedExit) {
    if (collectedCount === GEM_TILES.length) {
      gameState = 'won';
    } else {
      notice = 'The exit is sealed. Find every gem!';
    }
  }
}

function drawExit() {
  const exitX = tileCenter(EXIT_TILE.column);
  const exitY = tileCenter(EXIT_TILE.row);
  push();
  rectMode(CENTER);
  stroke('#b9f4b4');
  strokeWeight(2);
  fill(collectedCount === GEM_TILES.length ? '#55c878' : '#385442');
  rect(exitX, exitY, 26, 30, 4);
  noStroke();
  fill('#f1d88b');
  circle(exitX + 7, exitY, 3);
  pop();
}

function drawHud() {
  const hudTop = MAZE_LAYOUT.length * TILE_SIZE;
  noStroke();
  fill('#101315');
  rect(0, hudTop, width, HUD_HEIGHT);
  fill('#f3e7c8');
  textSize(17);
  textAlign(LEFT, CENTER);
  text(`GEMS: ${collectedCount}/${GEM_TILES.length}`, 18, hudTop + 25);
  textSize(13);
  fill('#c5c6c2');
  text(notice || 'Find the gems. Watch the guard.', 18, hudTop + 55);
}

function drawMessage(title, subtitle) {
  const messageY = (MAZE_LAYOUT.length * TILE_SIZE) / 2;
  push();
  rectMode(CENTER);
  noStroke();
  fill(8, 10, 12, 210);
  rect(width / 2, messageY, width - 80, 104, 10);
  textAlign(CENTER, CENTER);
  fill('#ffe8a8');
  textSize(24);
  text(title, width / 2, messageY - 18);
  fill('#ffffff');
  textSize(14);
  text(subtitle, width / 2, messageY + 18);
  pop();
}

function keyPressed(event) {
  if (event.repeat) return false;

  if (gameState === 'ready' && (keyCode === ENTER || key === ' ')) {
    gameState = 'playing';
  } else if (key === 'r' || key === 'R') {
    createLevel();
    gameState = 'ready';
  }

  if ([LEFT_ARROW, RIGHT_ARROW, UP_ARROW, DOWN_ARROW, 32].includes(keyCode)) {
    return false;
  }
}
