// realtime-server.js

const WebSocket = require("ws");
const http = require("http");
const mysql = require("mysql2/promise");

const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL;

// 1. MySQL connection pool
const db = mysql.createPool({
  host: "localhost",
  user: "root", // change this
  password: "", // change this
  database: "voting_kiosk_db", // change this
  port: 3306,
});

// 2. WebSocket Server
const wss = new WebSocket.Server({ port: 8081 }, () => {
  console.log(`WebSocket server listening on ${WEBSOCKET_URL}`);
});

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", async (message) => {
    console.log("Received from client:", message);

    try {
      const parsed = JSON.parse(message);
      if (parsed.action === "getFingerprint" && parsed.data?.student_id) {
        const studentId = parsed.data.student_id;
        console.log("Received student ID:", studentId); // ✅ CONFIRM HERE
        const [rows] = await db.query(
          "SELECT fingerprint_hash FROM voters WHERE student_id = ?",
          [studentId]
        );
        console.log(rows);
        if (rows.length > 0) {
          ws.send(JSON.stringify({
            status: "success",
            fingerprint_hash: rows[0].fingerprint_hash,
          }));
        } else {
          ws.send(JSON.stringify({
            status: "not_found",
            message: `No student found for ID ${studentId}`,
          }));
        }
      } else {
        ws.send(JSON.stringify({
          status: "error",
          message: "Invalid request format or missing student_id.",
        }));
      }
    } catch (err) {
      console.error("Error during DB query:", err);
      ws.send(JSON.stringify({
        status: "error",
        message: "Server error during fingerprint query.",
      }));
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// 3. Broadcast helper (still useful for notify endpoint)
wss.broadcast = function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

// 4. HTTP trigger for external broadcasts (optional)
const server = http.createServer((req, res) => {
  if (req.url === "/notify" && req.method === "POST") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const parsed = JSON.parse(body);
        const jsonString = JSON.stringify(parsed);
        wss.broadcast(jsonString);
        console.log("Broadcasted to clients:", jsonString);
        res.writeHead(200);
        res.end("Broadcasted");
      } catch (err) {
        console.error("Failed to parse JSON:", err);
        res.writeHead(400);
        res.end("Invalid JSON");
      }
    });
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(3001, () => {
  console.log("HTTP trigger listening on http://localhost:3001/notify");
});
