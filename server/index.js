// const express = require("express");
// const http = require("http");
// const { Server } = require("socket.io");
// const cors = require("cors");
// const mongoose = require("mongoose");
// require("dotenv").config();
// const Document = require("./models/Document");
// const axios = require("axios");

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: "http://localhost:3000",
//     methods: ["GET", "POST"],
//   },
// });

// app.use(cors());
// app.use(express.json());

// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB connected!"))
//   .catch((err) => console.error("MongoDB connection error:", err));

// app.get("/", (req, res) => {
//   res.send("Collab Editor Server is running!");
// });

// const LANGUAGE_IDS = {
//   javascript: 63,
//   python: 71,
//   cpp: 54,
//   java: 62,
//   typescript: 74,
// };

// app.post("/run", async (req, res) => {
//   const { code, language, stdin } = req.body;
//   const languageId = LANGUAGE_IDS[language];
//   if (!languageId) {
//     return res.status(400).json({ error: "Unsupported language" });
//   }
//   try {
//     const submission = await axios.post(
//       "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
//       {
//         source_code: code,
//         language_id: languageId,
//         stdin: stdin || "",
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     const result = submission.data;
//     res.json({
//       stdout: result.stdout,
//       stderr: result.stderr,
//       compile_output: result.compile_output,
//       status: result.status?.description,
//     });
//   } catch (err) {
//     console.error("Judge0 error:", err.message);
//     res.status(500).json({ error: "Failed to run code" });
//   }
// });

// const documentUsers = {};
// // debounce timers for saving — avoid hitting DB on every keystroke
// const saveTimers = {};

// io.on("connection", (socket) => {
//   console.log("User connected:", socket.id);

//   socket.on("join-document", async ({ documentId, username }) => {
//     try {
//       socket.join(documentId);
//       socket.documentId = documentId;
//       socket.username = username;

//       // Atomic upsert — avoids the race where two people joining a
//       // brand-new room at nearly the same time both try to create a
//       // document with the same _id, which would throw a duplicate-key
//       // error on whichever request loses the race.
//       const doc = await Document.findOneAndUpdate(
//         { _id: documentId },
//         { $setOnInsert: { content: "" } },
//         { new: true, upsert: true }
//       );

//       if (!documentUsers[documentId]) {
//         documentUsers[documentId] = [];
//       }

//       // avoid duplicate entries if this socket rejoins (e.g. React
//       // StrictMode double-invoking effects in dev, or a reconnect)
//       documentUsers[documentId] = documentUsers[documentId].filter(
//         (u) => u.id !== socket.id
//       );
//       documentUsers[documentId].push({ id: socket.id, username });

//       socket.emit("load-document", {
//         content: doc.content,
//         language: doc.language,
//       });
//       io.to(documentId).emit("online-users", documentUsers[documentId]);
//       console.log(`${username} joined document: ${documentId}`);
//     } catch (err) {
//       console.error("join-document error:", err.message);
//       socket.emit("join-error", { message: "Failed to join document" });
//     }
//   });

//   socket.on("send-changes", ({ value, documentId }) => {
//     socket.to(documentId).emit("receive-changes", { value });

//     // debounce save — write to DB 1 second after typing stops
//     if (saveTimers[documentId]) clearTimeout(saveTimers[documentId]);
//     saveTimers[documentId] = setTimeout(async () => {
//       try {
//         await Document.findByIdAndUpdate(documentId, {
//           content: value,
//           updatedAt: new Date(),
//         });
//         console.log(`Document ${documentId} saved to MongoDB`);
//       } catch (err) {
//         console.error("Save error:", err.message);
//       }
//     }, 1000);
//   });

//   socket.on("cursor-move", ({ documentId, position }) => {
//     socket.to(documentId).emit("cursor-update", {
//       userId: socket.id,
//       username: socket.username,
//       position,
//     });
//   });

//   socket.on("disconnect", () => {
//     const { documentId, username } = socket;
//     if (documentId && documentUsers[documentId]) {
//       documentUsers[documentId] = documentUsers[documentId].filter(
//         (u) => u.id !== socket.id
//       );
//       io.to(documentId).emit("online-users", documentUsers[documentId]);
//     }
//     console.log(`${username} disconnected`);
//   });
// });

// const PORT = process.env.PORT || 5001;
// server.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config();

const Document = require("./models/Document");
const axios = require("axios");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Serve React frontend (Production)
app.use(express.static(path.join(__dirname, "../client/build")));

// API Routes
app.get("/api", (req, res) => {
  res.send("Collab Editor Server is running!");
});

app.post("/run", async (req, res) => {
  const { code, language, stdin } = req.body;
  const LANGUAGE_IDS = {
    javascript: 63,
    python: 71,
    cpp: 54,
    java: 62,
    typescript: 74,
  };
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) {
    return res.status(400).json({ error: "Unsupported language" });
  }
  try {
    const submission = await axios.post(
      "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
      {
        source_code: code,
        language_id: languageId,
        stdin: stdin || "",
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    const result = submission.data;
    res.json({
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      status: result.status?.description,
    });
  } catch (err) {
    console.error("Judge0 error:", err.message);
    res.status(500).json({ error: "Failed to run code" });
  }
});

// Catch-all route - MUST BE THE LAST ROUTE
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Socket.IO Logic
const documentUsers = {};
const saveTimers = {};

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-document", async ({ documentId, username }) => {
    try {
      socket.join(documentId);
      socket.documentId = documentId;
      socket.username = username;

      const doc = await Document.findOneAndUpdate(
        { _id: documentId },
        { $setOnInsert: { content: "" } },
        { new: true, upsert: true }
      );

      if (!documentUsers[documentId]) {
        documentUsers[documentId] = [];
      }

      documentUsers[documentId] = documentUsers[documentId].filter(
        (u) => u.id !== socket.id
      );
      documentUsers[documentId].push({ id: socket.id, username });

      socket.emit("load-document", {
        content: doc.content,
        language: doc.language,
      });

      io.to(documentId).emit("online-users", documentUsers[documentId]);
    } catch (err) {
      console.error("join-document error:", err.message);
    }
  });

  socket.on("send-changes", ({ value, documentId }) => {
    socket.to(documentId).emit("receive-changes", { value });

    if (saveTimers[documentId]) clearTimeout(saveTimers[documentId]);
    saveTimers[documentId] = setTimeout(async () => {
      try {
        await Document.findByIdAndUpdate(documentId, {
          content: value,
          updatedAt: new Date(),
        });
        console.log(`Document ${documentId} saved`);
      } catch (err) {
        console.error("Save error:", err.message);
      }
    }, 1000);
  });

  socket.on("cursor-move", ({ documentId, position }) => {
    socket.to(documentId).emit("cursor-update", {
      userId: socket.id,
      username: socket.username,
      position,
    });
  });

  socket.on("disconnect", () => {
    const { documentId, username } = socket;
    if (documentId && documentUsers[documentId]) {
      documentUsers[documentId] = documentUsers[documentId].filter(
        (u) => u.id !== socket.id
      );
      io.to(documentId).emit("online-users", documentUsers[documentId]);
    }
    console.log(`${username || "User"} disconnected`);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});