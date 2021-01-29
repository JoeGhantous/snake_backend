const httpServer = require('http').createServer((req, res) => {
  // serve the index.html file
  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Content-Length', Buffer.byteLength(content));
  res.end(content);
});

const io = require("socket.io")(httpServer, {
  origins: ["https://milksnake.surge.sh"],

  handlePreflightRequest: (req, res) => {
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "https://milksnake.surge.sh",
      "Access-Control-Allow-Methods": "GET,POST",
      "Access-Control-Allow-Headers": "my-custom-header",
      "Access-Control-Allow-Credentials": true
    });
    res.end();
  }
});
const { initGame, gameLoop, getUpdatedVelocity } = require('./game');
const { FRAME_RATE } = require('./constants');
const { makeid } = require('./utils');

const state = {};
const clientRooms = {};
io.origins(["https://milksnake.surge.sh"]);
io.set( 'origins', 'https://milksnake.surge.sh' );
io.on('connection', client => {

  client.on('keydown', handleKeydown);
  client.on('newGame', handleNewGame);
  client.on('joinGame', handleJoinGame);

  function handleJoinGame(roomName) {
    const room = io.sockets.adapter.rooms[roomName];

    let allUsers;
    if (room) {
      allUsers = room.sockets;
    }

    let numClients = 0;
    if (allUsers) {
      numClients = Object.keys(allUsers).length;
    }

    if (numClients === 0) {
      client.emit('unknownCode');
      return;
    } else if (numClients > 1) {
      client.emit('tooManyPlayers');
      return;
    }

    clientRooms[client.id] = roomName;

    client.join(roomName);
    client.number = 2;
    client.emit('init', 2);

    startGameInterval(roomName);
  }

  function handleNewGame() {
    let roomName = makeid(5);
    clientRooms[client.id] = roomName;
    client.emit('gameCode', roomName);

    state[roomName] = initGame();

    client.join(roomName);
    client.number = 1;
    client.emit('init', 1);
    startGameInterval(roomName);
  }

  function handleKeydown(keyCode) {
    const roomName = clientRooms[client.id];
    if (!roomName) {
      return;
    }
    try {
      keyCode = parseInt(keyCode);
    } catch(e) {
      console.error(e);
      return;
    }

    const vel = getUpdatedVelocity(keyCode);

    if (vel) {
      state[roomName].players[client.number - 1].vel = vel;
    }
  }
});

function startGameInterval(roomName) {
  const intervalId = setInterval(() => {
    const winner = gameLoop(state[roomName]);

    if (!winner) {
      emitGameState(roomName, state[roomName])
    } else {
      emitGameOver(roomName, winner);
      state[roomName] = null;
      clearInterval(intervalId);
    }
  }, 1000 / FRAME_RATE);
}

function emitGameState(room, gameState) {
  score = gameState.players[0].snake.length;
  emitScore(room, score)
  // console.log(gameState.players[1].snake.length;
  // Send this event to everyone in the room.
  io.sockets.in(room)
    .emit('gameState', JSON.stringify(gameState));
}

function emitScore(room, score) {
  console.log("score :", score);
  // console.log(gameState.players[1].snake.length;
  // Send this event to everyone in the room.
  io.sockets.in(room)
    .emit('score', JSON.stringify(score));
}

function emitGameOver(room, winner) {
  io.sockets.in(room)
    .emit('gameOver', JSON.stringify({ winner }));
}

io.listen(process.env.PORT || 3000);
