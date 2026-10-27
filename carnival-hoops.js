const GAME_WIDTH = 860;
const GAME_HEIGHT = 600;
const BALL_LIMIT = 15;
const TARGET_SCORE = 10;
const DROP_BUTTON = { x: 340, y: 520, width: 180, height: 48 };
const OVERLAY_BUTTON = { x: GAME_WIDTH / 2 - 90, y: 365, width: 180, height: 50 };

let gamePhase = 'start';
let score = 0;
let ballsLeft = BALL_LIMIT;
let activeBall = null;
let paddle;
let basketParts = [];
let basketX = GAME_WIDTH / 2;
let basketDirection = 1;
let paddleDragging = false;
let lastDragY = 0;
let slowBallTime = 0;
let canvasElement;

function setup() {
  new Canvas(GAME_WIDTH, GAME_HEIGHT);
  world.gravity.y = 11;
  canvasElement = document.querySelector('#defaultCanvas0');
  document.querySelector('#game-container').appendChild(canvasElement);
  canvasElement.setAttribute('aria-label', 'Carnival Hoops game');
  createPlayfield();
}

function createPlayfield() {
  paddle = new Sprite(GAME_WIDTH / 2, GAME_HEIGHT * 0.53, 180, 16, 'kinematic');
  paddle.color = '#ffcb45';
  paddle.stroke = '#8a3d25';
  paddle.strokeWeight = 3;
  paddle.restitution = 0.82;
  paddle.friction = 0.15;

  const basketY = GAME_HEIGHT - 82;
  const leftSide = new Sprite(basketX - 36, basketY + 13, 12, 48, 'kinematic');
  leftSide.rotation = -28;
  const rightSide = new Sprite(basketX + 36, basketY + 13, 12, 48, 'kinematic');
  rightSide.rotation = 28;
  const basketBase = new Sprite(basketX, basketY + 37, 76, 10, 'kinematic');
  basketParts = [leftSide, rightSide, basketBase];

  for (const part of basketParts) {
    part.color = '#f05a43';
    part.stroke = '#8a3d25';
    part.strokeWeight = 3;
    part.restitution = 0.45;
  }
}

function update() {
  drawScene();

  if (gamePhase !== 'playing') return;

  moveBasket();
  checkBallProgress();
  drawHud();
}

function drawScene() {
  background('#fff1cf');
  noStroke();
  fill('#f7d9a1');
  rect(0, 0, GAME_WIDTH, 86);
  fill('#e8b764');
  rect(0, GAME_HEIGHT - 24, GAME_WIDTH, 24);

  fill('#b33f4a');
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(30);
  text('CARNIVAL HOOPS', GAME_WIDTH / 2, 43);
  textStyle(NORMAL);

  for (let x = 26; x < GAME_WIDTH; x += 52) {
    fill(x % 104 === 26 ? '#e66b4e' : '#f7be48');
    circle(x, 104, 8);
  }

  if (gamePhase === 'start') {
    drawOverlay(
      'Ready to shoot?',
      'Score 10 baskets before your 15 balls run out.',
      'Drag the gold paddle to move it. Hold Shift and drag to tilt.'
    );
    drawButton(OVERLAY_BUTTON.x, OVERLAY_BUTTON.y, OVERLAY_BUTTON.width, OVERLAY_BUTTON.height, 'START GAME');
  } else if (gamePhase === 'won' || gamePhase === 'lost') {
    drawOverlay(
      gamePhase === 'won' ? 'YOU WIN!' : 'GAME OVER',
      'Final score: ' + score + ' / ' + TARGET_SCORE,
      gamePhase === 'won' ? 'You are the carnival champion!' : 'Try a new angle and take another shot.'
    );
    drawButton(OVERLAY_BUTTON.x, OVERLAY_BUTTON.y, OVERLAY_BUTTON.width, OVERLAY_BUTTON.height, 'PLAY AGAIN');
  }
}

function drawHud() {
  noStroke();
  fill('#7b3340');
  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(19);
  text('BASKETS: ' + score + ' / ' + TARGET_SCORE, 26, 132);
  textAlign(RIGHT, CENTER);
  text('BALLS LEFT: ' + ballsLeft, GAME_WIDTH - 26, 132);
  textStyle(NORMAL);

  if (!activeBall && ballsLeft > 0) {
    drawButton(DROP_BUTTON.x, DROP_BUTTON.y, DROP_BUTTON.width, DROP_BUTTON.height, 'DROP NEXT BALL');
    textAlign(CENTER, CENTER);
    textSize(14);
    fill('#7b3340');
    text('Press SPACE or click the button', GAME_WIDTH / 2, DROP_BUTTON.y - 17);
  } else if (activeBall) {
    textAlign(CENTER, CENTER);
    textSize(14);
    fill('#7b3340');
    text('Drag to guide the ball. Hold Shift while dragging to tilt.', GAME_WIDTH / 2, GAME_HEIGHT - 42);
  }
}

function drawOverlay(title, subtitle, instructions) {
  noStroke();
  fill(73, 35, 44, 225);
  rect(130, 170, GAME_WIDTH - 260, 260, 22);

  textAlign(CENTER, CENTER);
  fill('#fff6df');
  textStyle(BOLD);
  textSize(34);
  text(title, GAME_WIDTH / 2, 225);
  textStyle(NORMAL);
  textSize(19);
  text(subtitle, GAME_WIDTH / 2, 275);
  textSize(16);
  text(instructions, GAME_WIDTH / 2, 318);
}

function drawButton(x, y, width, height, label) {
  noStroke();
  fill('#b33f4a');
  rect(x, y, width, height, 12);
  fill('#fff6df');
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(16);
  text(label, x + width / 2, y + height / 2);
  textStyle(NORMAL);
}

function moveBasket() {
  basketX += basketDirection * 2.2;
  if (basketX < 110 || basketX > GAME_WIDTH - 110) basketDirection *= -1;

  const basketY = GAME_HEIGHT - 82;
  basketParts[0].x = basketX - 36;
  basketParts[0].y = basketY + 13;
  basketParts[1].x = basketX + 36;
  basketParts[1].y = basketY + 13;
  basketParts[2].x = basketX;
  basketParts[2].y = basketY + 37;
}

function dropBall() {
  if (gamePhase !== 'playing' || activeBall || ballsLeft <= 0) return;

  ballsLeft -= 1;
  activeBall = new Sprite();
  activeBall.x = random(140, GAME_WIDTH - 140);
  activeBall.y = 116;
  activeBall.diameter = 22;
  activeBall.color = '#f04f45';
  activeBall.stroke = '#8a3d25';
  activeBall.strokeWeight = 2;
  activeBall.restitution = 0.68;
  activeBall.friction = 0.12;
  activeBall.bounciness = 0.68;
  activeBall.carnivalPreviousY = activeBall.y;
  slowBallTime = 0;
}

function checkBallProgress() {
  if (!activeBall) return;

  const basketOpeningY = GAME_HEIGHT - 82 - 13;
  const enteredBasket =
    activeBall.carnivalPreviousY < basketOpeningY &&
    activeBall.y >= basketOpeningY &&
    activeBall.vel.y > 0 &&
    Math.abs(activeBall.x - basketX) < 25;

  if (enteredBasket) {
    score += 1;
    removeActiveBall();
    if (score >= TARGET_SCORE) {
      gamePhase = 'won';
    } else if (ballsLeft === 0) {
      gamePhase = 'lost';
    }
    return;
  }

  const ballSpeed = Math.hypot(activeBall.vel.x, activeBall.vel.y);
  if (ballSpeed < 0.8 && activeBall.y > GAME_HEIGHT - 145) {
    slowBallTime += deltaTime;
  } else {
    slowBallTime = 0;
  }

  if (activeBall.y > GAME_HEIGHT + 35 || slowBallTime > 1800) {
    removeActiveBall();
    if (ballsLeft === 0 && score < TARGET_SCORE) gamePhase = 'lost';
    return;
  }

  activeBall.carnivalPreviousY = activeBall.y;
}

function removeActiveBall() {
  if (!activeBall) return;
  activeBall.remove();
  activeBall = null;
  slowBallTime = 0;
}

function startOrRestartGame() {
  if (gamePhase === 'start') {
    gamePhase = 'playing';
    return;
  }

  removeActiveBall();
  paddle.remove();
  for (const part of basketParts) part.remove();
  score = 0;
  ballsLeft = BALL_LIMIT;
  basketX = GAME_WIDTH / 2;
  basketDirection = 1;
  gamePhase = 'playing';
  createPlayfield();
}

function mousePressed() {
  if (gamePhase === 'start' || gamePhase === 'won' || gamePhase === 'lost') {
    if (pointInButton(mouseX, mouseY, OVERLAY_BUTTON)) startOrRestartGame();
    return false;
  }

  if (!activeBall && pointInButton(mouseX, mouseY, DROP_BUTTON)) {
    dropBall();
    return false;
  }

  if (gamePhase === 'playing' && Math.abs(mouseX - paddle.x) < 110 && Math.abs(mouseY - paddle.y) < 45) {
    paddleDragging = true;
    lastDragY = mouseY;
    return false;
  }
}

function mouseDragged() {
  if (!paddleDragging || gamePhase !== 'playing') return false;

  if (keyIsDown(SHIFT)) {
    paddle.rotation = constrain(paddle.rotation + (mouseY - lastDragY) * 0.7, -35, 35);
  } else {
    paddle.x = constrain(mouseX, 100, GAME_WIDTH - 100);
    paddle.y = constrain(mouseY, 170, GAME_HEIGHT - 155);
  }
  lastDragY = mouseY;
  return false;
}

function mouseReleased() {
  paddleDragging = false;
}

function keyPressed() {
  if (key === ' ' && gamePhase === 'playing') {
    dropBall();
    return false;
  }
  if ((key === 'r' || key === 'R') && (gamePhase === 'won' || gamePhase === 'lost')) {
    startOrRestartGame();
  }
}

function pointInButton(x, y, button) {
  return x >= button.x && x <= button.x + button.width &&
    y >= button.y && y <= button.y + button.height;
}
