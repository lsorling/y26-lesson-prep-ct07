const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const MAX_WAVES = 3;
const DANGER_LINE_Y = 510;
const ALIEN_PATTERN = [
  '00111100',
  '01111110',
  '11111111',
  '11011011',
  '11111111',
  '00100100'
];

let player;
let aliens = [];
let playerShots = [];
let alienShots = [];
let stars = [];
let gameState = 'title';
let score = 0;
let highScore = 0;
let lives = 3;
let wave = 1;
let alienDirection = 1;
let lastPlayerShotFrame = 0;
let lastAlienShotFrame = 0;
let invulnerableUntilFrame = 0;
let waveCompleteAtFrame = 0;

function setup() {
  new Canvas(GAME_WIDTH, GAME_HEIGHT);
  world.gravity.y = 0;
  textFont('monospace');

  highScore = Math.max(0, Number(sessionStorage.getItem('spaceDefenseHighScore')) || 0);
  stars = Array.from({ length: 75 }, () => ({
    x: random(GAME_WIDTH),
    y: random(GAME_HEIGHT),
    size: random(1, 3),
    speed: random(0.15, 0.7)
  }));
  resetGame();
  gameState = 'title';
}

function resetGame() {
  removeSpriteList(aliens);
  removeSpriteList(playerShots);
  removeSpriteList(alienShots);
  if (player) player.remove();

  score = 0;
  lives = 3;
  wave = 1;
  invulnerableUntilFrame = 0;
  player = makeHiddenSprite(GAME_WIDTH / 2, GAME_HEIGHT - 48, 42, 28);
  createWave();
}

function createWave() {
  removeSpriteList(aliens);
  removeSpriteList(playerShots);
  removeSpriteList(alienShots);
  aliens = [];
  playerShots = [];
  alienShots = [];
  alienDirection = 1;

  const rows = 4;
  const columns = 9;
  const left = 125;
  const top = 112;
  const columnGap = 68;
  const rowGap = 43;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      aliens.push({
        sprite: makeHiddenSprite(left + column * columnGap, top + row * rowGap, 40, 30),
        row
      });
    }
  }
  lastAlienShotFrame = frameCount;
}

function makeHiddenSprite(x, y, spriteWidth, spriteHeight) {
  const sprite = new Sprite(x, y, spriteWidth, spriteHeight);
  sprite.collider = 'none';
  sprite.visible = false;
  return sprite;
}

function removeSpriteList(sprites) {
  for (const sprite of sprites) {
    (sprite.sprite || sprite).remove();
  }
}

function draw() {
  drawSpace();
  drawDangerLine();
  drawAliens();
  drawShots();
  drawPlayer();
  drawHud();

  if (gameState === 'playing') {
    updatePlayer();
    updateAliens();
    if (gameState === 'playing') {
      updateShots();
      checkWaveProgress();
    }
  } else if (gameState === 'waveComplete' && frameCount >= waveCompleteAtFrame) {
    if (wave === MAX_WAVES) {
      gameState = 'victory';
    } else {
      wave += 1;
      createWave();
      gameState = 'playing';
    }
  }

  drawStateMessage();
}

function drawSpace() {
  background('#070b18');
  noStroke();
  for (const star of stars) {
    fill(150, 210, 255, 120 + star.size * 35);
    rect(star.x, star.y, star.size, star.size);
    if (gameState === 'playing') {
      star.y += star.speed;
      if (star.y > GAME_HEIGHT) {
        star.y = 0;
        star.x = random(GAME_WIDTH);
      }
    }
  }
}

function drawDangerLine() {
  push();
  stroke('#ff5364');
  strokeWeight(1);
  drawingContext.setLineDash([8, 8]);
  line(0, DANGER_LINE_Y, GAME_WIDTH, DANGER_LINE_Y);
  drawingContext.setLineDash([]);
  pop();
}

function drawAliens() {
  const colors = ['#9cff66', '#56e6a5', '#55d7ff', '#c28aff'];
  for (const alien of aliens) {
    drawPixelAlien(alien.sprite.x, alien.sprite.y, colors[alien.row]);
  }
}

function drawPixelAlien(x, y, color) {
  const pixel = 5;
  push();
  noStroke();
  fill(color);
  for (let row = 0; row < ALIEN_PATTERN.length; row += 1) {
    for (let column = 0; column < ALIEN_PATTERN[row].length; column += 1) {
      if (ALIEN_PATTERN[row][column] === '1') {
        rect(
          x - 20 + column * pixel,
          y - 15 + row * pixel,
          pixel,
          pixel
        );
      }
    }
  }
  pop();
}

function drawShots() {
  noStroke();
  fill('#7fffd4');
  for (const shot of playerShots) {
    rect(shot.x - 2, shot.y - 9, 4, 18, 2);
  }
  fill('#ff6d7f');
  for (const shot of alienShots) {
    rect(shot.x - 2, shot.y - 8, 4, 16, 2);
  }
}

function drawPlayer() {
  if (!player) return;
  if (frameCount < invulnerableUntilFrame && frameCount % 10 < 5) return;

  const x = player.x;
  const y = player.y;
  noStroke();
  fill('#35d9ff');
  rect(x - 5, y - 14, 10, 6);
  rect(x - 14, y - 8, 28, 6);
  rect(x - 21, y - 2, 42, 7);
  fill('#d7fbff');
  rect(x - 3, y - 12, 6, 4);
  fill('#ffcf62');
  rect(x - 9, y + 5, 5, 6);
  rect(x + 4, y + 5, 5, 6);
}

function drawHud() {
  noStroke();
  fill('#111a2d');
  rect(0, 0, GAME_WIDTH, 62);
  fill('#e8f4ff');
  textAlign(LEFT, CENTER);
  textSize(17);
  text(`SCORE ${score}`, 22, 23);
  text(`BEST ${highScore}`, 22, 45);
  textAlign(CENTER, CENTER);
  fill('#7fffd4');
  text(`WAVE ${wave}/${MAX_WAVES}`, GAME_WIDTH / 2, 30);
  textAlign(RIGHT, CENTER);
  fill('#ff8290');
  text(`LIVES ${'♥ '.repeat(lives).trim()}`, GAME_WIDTH - 22, 30);
}

function updatePlayer() {
  let movement = 0;
  if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) movement -= 1;
  if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) movement += 1;
  player.x = constrain(player.x + movement * 5.5, 24, GAME_WIDTH - 24);

  if (keyIsDown(32) && frameCount - lastPlayerShotFrame >= 13) {
    playerShots.push(makeHiddenSprite(player.x, player.y - 20, 5, 18));
    lastPlayerShotFrame = frameCount;
  }
}

function updateAliens() {
  if (aliens.length === 0) return;

  const speed = 0.75 + (wave - 1) * 0.35 + (36 - aliens.length) * 0.045;
  let leftEdge = GAME_WIDTH;
  let rightEdge = 0;
  for (const alien of aliens) {
    leftEdge = Math.min(leftEdge, alien.sprite.x - 20);
    rightEdge = Math.max(rightEdge, alien.sprite.x + 20);
  }

  if ((alienDirection > 0 && rightEdge + speed >= GAME_WIDTH - 18) ||
      (alienDirection < 0 && leftEdge - speed <= 18)) {
    alienDirection *= -1;
    for (const alien of aliens) {
      alien.sprite.y += 20;
      if (alien.sprite.y + 15 >= DANGER_LINE_Y) {
        gameState = 'gameOver';
        return;
      }
    }
  }

  for (const alien of aliens) {
    alien.sprite.x += speed * alienDirection;
    if (alien.sprite.y + 15 >= DANGER_LINE_Y) {
      gameState = 'gameOver';
      return;
    }
  }

  const shotInterval = Math.max(28, 92 - wave * 12);
  if (frameCount - lastAlienShotFrame >= shotInterval) {
    const shooter = random(aliens);
    alienShots.push(makeHiddenSprite(shooter.sprite.x, shooter.sprite.y + 20, 5, 16));
    lastAlienShotFrame = frameCount;
  }
}

function updateShots() {
  for (let shotIndex = playerShots.length - 1; shotIndex >= 0; shotIndex -= 1) {
    const shot = playerShots[shotIndex];
    shot.y -= 8;
    if (shot.y < -12) {
      shot.remove();
      playerShots.splice(shotIndex, 1);
      continue;
    }

    for (let alienIndex = aliens.length - 1; alienIndex >= 0; alienIndex -= 1) {
      const alien = aliens[alienIndex];
      if (Math.abs(shot.x - alien.sprite.x) < 22 &&
          Math.abs(shot.y - alien.sprite.y) < 20) {
        score += (4 - alien.row) * 10;
        highScore = Math.max(highScore, score);
        sessionStorage.setItem('spaceDefenseHighScore', String(highScore));
        shot.remove();
        alien.sprite.remove();
        playerShots.splice(shotIndex, 1);
        aliens.splice(alienIndex, 1);
        break;
      }
    }
  }

  for (let shotIndex = alienShots.length - 1; shotIndex >= 0; shotIndex -= 1) {
    const shot = alienShots[shotIndex];
    shot.y += 4 + wave * 0.4;
    if (shot.y > GAME_HEIGHT + 12) {
      shot.remove();
      alienShots.splice(shotIndex, 1);
      continue;
    }

    if (frameCount >= invulnerableUntilFrame &&
        Math.abs(shot.x - player.x) < 23 &&
        Math.abs(shot.y - player.y) < 19) {
      shot.remove();
      alienShots.splice(shotIndex, 1);
      loseLife();
    }
  }
}

function loseLife() {
  lives -= 1;
  removeSpriteList(alienShots);
  alienShots = [];
  invulnerableUntilFrame = frameCount + 100;
  if (lives <= 0) {
    gameState = 'gameOver';
  }
}

function checkWaveProgress() {
  if (gameState === 'playing' && aliens.length === 0) {
    removeSpriteList(playerShots);
    removeSpriteList(alienShots);
    playerShots = [];
    alienShots = [];
    gameState = 'waveComplete';
    waveCompleteAtFrame = frameCount + 100;
  }
}

function drawStateMessage() {
  if (gameState === 'playing') return;

  let title = '';
  let subtitle = '';
  if (gameState === 'title') {
    title = 'SPACE DEFENSE';
    subtitle = 'Protect Earth through all 3 waves';
  } else if (gameState === 'paused') {
    title = 'PAUSED';
    subtitle = 'Press P or Esc to resume';
  } else if (gameState === 'waveComplete') {
    title = `WAVE ${wave} CLEARED!`;
    subtitle = wave === MAX_WAVES ? 'Final victory incoming...' : 'Get ready for a faster wave';
  } else if (gameState === 'gameOver') {
    title = 'EARTH HAS FALLEN';
    subtitle = `Final score: ${score}  |  Press Enter to try again`;
  } else if (gameState === 'victory') {
    title = 'EARTH IS SAFE!';
    subtitle = `All 3 waves defeated! Score: ${score}  |  Press Enter to play again`;
  }

  push();
  noStroke();
  fill(4, 8, 20, 220);
  rect(55, 190, GAME_WIDTH - 110, 220, 14);
  textAlign(CENTER, CENTER);
  fill(gameState === 'gameOver' ? '#ff8290' : '#7fffd4');
  textSize(32);
  text(title, GAME_WIDTH / 2, 237);
  fill('#e8f4ff');
  textSize(15);
  text(subtitle, GAME_WIDTH / 2, 277);
  drawInstructions();
  pop();
}

function drawInstructions() {
  textAlign(CENTER, CENTER);
  fill('#b8cce2');
  textSize(13);
  if (gameState === 'title') {
    text('Move: ← / → or A / D     Fire: Space', GAME_WIDTH / 2, 328);
    text('Pause: P or Esc     Start: Enter', GAME_WIDTH / 2, 351);
    fill('#ffcf62');
    text('Press Enter to defend the planet', GAME_WIDTH / 2, 382);
  } else if (gameState === 'paused') {
    text('Your progress is safe. Resume when ready.', GAME_WIDTH / 2, 339);
  }
}

function keyPressed(event) {
  if (event && event.repeat) return false;

  if (keyCode === ENTER && (gameState === 'title' ||
      gameState === 'gameOver' || gameState === 'victory')) {
    resetGame();
    gameState = 'playing';
  } else if ((key === 'p' || key === 'P' || keyCode === 27) &&
      (gameState === 'playing' || gameState === 'paused')) {
    gameState = gameState === 'playing' ? 'paused' : 'playing';
  }

  if ([LEFT_ARROW, RIGHT_ARROW, 32].includes(keyCode)) return false;
}
