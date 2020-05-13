var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var ws = require("ws");
var client = require("socket.io-client");
const axios = require("axios");

const PORT = 3000;
const key = `node-${Date.now()}`;

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var socketListeners = (socket) => {
  socket.on("hello", () => {
    console.log("Hello");
  });

  socket.on("get nodeList", () => console.log(socket.id));

  socket.on("connect confirm", (data) => {
    console.log("connect confirm");
    keyList.push(data.key);
    socket.emit("callback confirm", { key, node, length: keyList.length });
    if (data.length === 1 && keyList.length > 2) {
      io.emit("request join net", { node: data.node, key: data.key });
    }
  });

  socket.on("callback confirm", (data) => {
    console.log("callback confirm");
    keyList.push(data.key);
    if (data.length === 1 && keyList.length > 2) {
      io.emit("request join net", { node: data.node, key: data.key });
    }
  });

  socket.on("request join net", (data) => {
    if (!keyList.includes(data.key)) {
      getSocket(data.node);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected, ID: ${socket.id}`);
  });

  return socket;
};

var socketNode = [];
var keyList = [key];
socketNode.push(socketListeners(client(`http://localhost:${PORT}`)));

var getSocket = (node) => {
  var socket = client(node);
  socketNode.push(socket);
  socket.emit("connect confirm", { key, node, length: keyList.length });
  socketListeners(socket);
};

io.on("connection", (socket) => {
  socketNode.push(socket);
  socketListeners(socket);
});

// var socket = socketListener(client(`http://localhost:${PORT}`));
// socketNode.push(socket);

app.get("/nodes", (req, res) => {
  const { callback, port, nodeLength } = req.query;
  const node = `http://localhost:${port}`;
  getSocket(node);
  if (callback === "true") {
    console.info(`Added node ${node} back`);
    res.json({ status: "Added node Back" }).end();
  } else {
    axios.get(`${node}/nodes?callback=true&port=${PORT}&nodeLength=${keyList}`);
    console.info(`Added node ${node}`);
    res.json({ status: "Added node" }).end();
  }
});

app.get("/hello", (req, res) => {
  io.emit("hello");
});

app.get("/node-list", (req, res) => {
  io.emit("get nodeList");
  res.json({ status: 200 });
});

var server = http.listen(PORT, () => {
  console.log(`Express server running on ${PORT}...`);
});
