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

var socketListeners = (socket) => {
  socket.on("hello", () => {
    console.log("Hello");
  });

  socket.on("get nodeList", () => console.log(nodeList));

  socket.on("connect confirm", (data) => {
    console.log("connect confirm");
    keyList.push(data.key);
    socket.emit("callback confirm", {
      key,
      node: data.node,
      length: keyList.length,
    });
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

var socketNodes = [];
var nodeList = [];
//socketNodes.push(socketListeners(client(`http://localhost:${PORT}`)));

io.on("connection", (socket) => {
  console.info(`Socket connected, ID: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`Socket disconnected, ID: ${socket.id}`);
  });
});

// var socket = socketListener(client(`http://localhost:${PORT}`));
// socketNode.push(socket);

app.post("/nodes", (req, res) => {
  const { host, port } = req.body;
  const { callback, nodeLength } = req.query;
  const node = `http://${host}:${port}`;
  nodeList.push(node);
  const socketNode = socketListeners(client(node));
  socketNodes.push(socketNode);
  if (callback === "true") {
    if (parseInt(nodeLength) > 1 && nodeList.length === 1) {
      axios.post(`${node}/request-list`, {
        host: req.hostname,
        port: PORT,
      });
    } else if (nodeList.length > 1 && parseInt(nodeLength) === 1) {
      axios.post(`${node}/update-list`, {
        requestNodeList: nodeList,
      });
    }
    console.info(`Added node ${node} back`);
    res.json({ status: "Added node Back" }).end();
  } else {
    axios.post(`${node}/nodes?callback=true&nodeLength=${nodeList.length}`, {
      host: req.hostname,
      port: PORT,
    });
    console.info(`Added node ${node}`);
    res.json({ status: "Added node" }).end();
  }
});

app.get("/hello", (req, res) => {
  io.emit("hello");
  res.json({ status: 200 });
});

app.get("/node-list", (req, res) => {
  io.emit("get nodeList");
  res.json({ status: 200 });
});

app.post("/request-list", (req, res) => {
  const { host, port } = req.body;
  const node = `http://${host}:${port}`;
  axios.post(`${node}/update-list`, {
    requestNodeList: nodeList,
  });
  res.json({ status: "request accepted" }).end();
});

app.post("/update-list", (req, res) => {
  const { requestNodeList } = req.body;
  const currentNode = `http://${req.hostname}:${PORT}`;
  console.log(currentNode);

  for (let index = 0; index < requestNodeList.length; index++) {
    if (requestNodeList[index] !== currentNode) {
      axios.post(`${requestNodeList[index]}/request-join`, {
        host: req.hostname,
        port: PORT,
      });
    }
  }
  res.json({ status: "node list return" }).end();
});

app.post("/request-join", (req, res) => {
  const { host, port } = req.body;
  const { callback } = req.query;
  const node = `http://${host}:${port}`;
  nodeList.push(node);
  const socketNode = socketListeners(client(node));
  socketNodes.push(socketNode);
  if (callback === "true") {
    console.info(`Added node ${node} back`);
    res.json({ status: "Added node Back" }).end();
  } else {
    axios.post(`${node}/request-join?callback=true`, {
      host: req.hostname,
      port: PORT,
    });
    console.info(`Added node ${node}`);
    res.json({ status: "Added node" }).end();
  }
});

var server = http.listen(PORT, () => {
  console.log(`Express server running on ${PORT}...`);
});
