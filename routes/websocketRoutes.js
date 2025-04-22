

const WebSocket = require("ws");
const { handleConnection } = require("../controllers/websocketController");

const setupWebSocketServer = (server) => {
    const wss = new WebSocket.Server({ server });
    
    wss.on("connection", (ws) => {
        handleConnection(ws);
    });
};

module.exports = { setupWebSocketServer };