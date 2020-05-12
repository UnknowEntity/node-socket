var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var client = require("socket.io-client");
const axios = require("axios");

const PORT = 3000;

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var socketNode = [];
// var socket = socketListener(client(`http://localhost:${PORT}`));
// socketNode.push(socket);

app.get("/nodes", (req, res) => {
  const { callback, port } = req.query;
  const node = `http://localhost:${port}`;
  const socketClient = client.connect(node);
  socketNode.push(socketClient);
  if (callback === "true") {
    console.info(`Added node ${node} back`);
    res.json({ status: "Added node Back" }).end();
  } else {
    axios.get(`${node}/nodes?callback=true&port=${PORT}`);
    console.info(`Added node ${node}`);
    res.json({ status: "Added node" }).end();
  }
});

app.get("/hello", (req, res) => {
  io.emit("hello");
});

io.on("connection", (socket) => {
  socket.on("hello", () => {
    console.log("hi");
  });
  socket.on("disconnect", () => {
    console.log(`Socket disconnected, ID: ${socket.id}`);
  });
});

var server = http.listen(PORT, () => {
  console.log(`Express server running on ${PORT}...`);
});
