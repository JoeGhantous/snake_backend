const BG_COLOUR = '#231f20';
const SNAKE_COLOUR = '#c2c2c2';
const FOOD_COLOUR = '#e66916';

const socket = io("https://limitless-mountain-18440.herokuapp.com");

socket.on('init', handleInit);
socket.on('gameState', handleGameState);
socket.on('gameOver', handleGameOver);
socket.on('gameCode', handleGameCode);
socket.on('unknownCode', handleUnknownCode);
socket.on('tooManyPlayers', handleTooManyPlayers);
socket.on('score', handleServerScore);

const gameScreen = document.getElementById('gameScreen');
const initialScreen = document.getElementById('initialScreen');
const newGameBtn = document.getElementById('newGameButton');
const joinGameBtn = document.getElementById('joinGameButton');
const gameCodeInput = document.getElementById('gameCodeInput');
const gameCodeDisplay = document.getElementById('gameCodeDisplay');
const score = document.getElementById('score');
const serverScore = document.getElementById('serverScore');

newGameBtn.addEventListener('click', newGame);
joinGameBtn.addEventListener('click', joinGame);

var hammertime = new Hammer(gameScreen);
hammertime.get('pan').set({ direction: Hammer.DIRECTION_ALL });
hammertime.on('pan', function(ev) {
  try {
    console.log(ev.additionalEvent);
    if (ev.additionalEvent == "panup") {
      let keyCode = 38
      touchDown(keyCode)
    }
    else if (ev.additionalEvent == "pandown") {
      let keyCode = 40
      touchDown(keyCode)
    }
    else if (ev.additionalEvent == "panleft") {
      let keyCode = 37
      touchDown(keyCode)
    }
    else if (ev.additionalEvent == "panright") {
      let keyCode = 39
      touchDown(keyCode)
    }
  } catch (e) {

  } finally {

  }

});

function newGame() {
  socket.emit('newGame');
  init();
}

function joinGame() {
  const code = gameCodeInput.value;
  socket.emit('joinGame', code);
  init();
}

let canvas, ctx;
let playerNumber;
let gameActive = false;

function init() {
  initialScreen.style.display = "none";
  gameScreen.style.display = "block";

  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  canvas.width = canvas.height = 600;

  ctx.fillStyle = BG_COLOUR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  document.addEventListener('keydown', keydown);
  gameActive = true;
}

function keydown(e) {
  socket.emit('keydown', e.keyCode);
  console.log(e.keyCode);
}

function touchDown(e) {
  socket.emit('keydown', e);
  console.log(e);
}

function paintGame(state) {
  ctx.fillStyle = BG_COLOUR;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const food = state.food;
  const gridsize = state.gridsize;
  const size = canvas.width / gridsize;

  ctx.fillStyle = FOOD_COLOUR;
  ctx.fillRect(food.x * size, food.y * size, size, size);

  paintPlayer(state.players[0], size, SNAKE_COLOUR);
  paintPlayer(state.players[1], size, 'red');
}

function paintPlayer(playerState, size, colour) {
  const snake = playerState.snake;

  ctx.fillStyle = colour;
  for (let cell of snake) {
    ctx.fillRect(cell.x * size, cell.y * size, size, size);
  }
}

function handleInit(number) {
  playerNumber = number;
}

function handleGameState(gameState) {
  if (!gameActive) {
    return;
  }
  gameState = JSON.parse(gameState);
  // console.log(gameState)
  // console.log(gameState.players[0].snake.length)
  handleScore(gameState.players[0].snake.length)
  requestAnimationFrame(() => paintGame(gameState));
}
function handleGameOver(data) {
  if (!gameActive) {
    return;
  }
  data = JSON.parse(data);

  gameActive = false;

  if (data.winner === playerNumber) {
    alert('You Win!');
  } else {
    alert('You Lose :(');
  }
}

function handleGameCode(gameCode) {
  gameCodeDisplay.innerText = gameCode;
}

function handleScore(scoreCode) {
  score.innerText = scoreCode;
}

function handleServerScore(scoreCode) {
  // console.log("handling score")
  serverScore.innerText = scoreCode;
}

function handleUnknownCode() {
  reset();
  alert('Unknown Game Code')
}

function handleTooManyPlayers() {
  reset();
  alert('This game is already in progress');
}

function reset() {
  playerNumber = null;
  gameCodeInput.value = '';
  initialScreen.style.display = "block";
  gameScreen.style.display = "none";
}
