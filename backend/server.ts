import bodyParser from "body-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import http from "http";
import mongoose from "mongoose";
import { Socket, Server as SocketIOServer } from "socket.io";
import {
  addCategory,
  categoryExists,
  getAliases,
  getMmr,
  getNames,
} from "./controllers/food_category_controller";
import { addUser } from "./controllers/user_controller";
import {
  addUserToSession,
  getOrCreateActiveSession,
  getSelection,
  getTasted,
  isSessionRunning,
  performVote,
} from "./controllers/voting_session_controller";
import { GenerateSelections } from "./core/selection";
import { SessionData } from "./models";

const app = express();

const server = http.createServer(app);
const port = process.env.REST_PORT ? parseInt(process.env.REST_PORT, 10) : 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

const io = new SocketIOServer(server, {
  cors: {
    origin: [
      "localhost:9000",
      "https://tastr-production.up.railway.app",
      "https://node-server-production-588f.up.railway.app",
    ],
    methods: ["GET", "POST"],
  },
});

const startNewRound = async (sessionId: string, categoryId: string) => {
  console.log("All clients are ready. Preparing next round.");
  const sessionEntry = await SessionData.findOne({ sessionId });

  if (!sessionEntry) {
    console.error("No session with session Id found!");
    return;
  }

  const tasterIds = sessionEntry.tasterIds;
  console.log(
    `Starting new voting round for category ${categoryId} with host ${sessionEntry.hostId} and users ${tasterIds}`
  );

  sessionEntry.round += 1;
  sessionEntry.waitingIds = Object.assign([], tasterIds);
  await sessionEntry.save();

  await GenerateSelections(categoryId, tasterIds, sessionEntry.round);

  console.log(`Starting round ${sessionEntry.round}`);
  if (sessionEntry.round === 1) {
    io.emit("start", { sessionId: sessionId });
  } else {
    io.emit("round ready", { sessionId: sessionId, round: sessionEntry.round });
  }
};

// Connect to database.
mongoose
  .connect(process.env.MONGO_URL as string)
  .then(() => {
    console.log("Connected to database");
  })
  .catch((err) => {
    console.error("Failed to connect to database", err);
    return 1;
  });

io.on("connection", (socket: Socket) => {
  console.log(`New client ${socket.id} connected`);

  socket.on("join", (data: { userId: string }) => {
    console.log(`User ${data.userId} has joined`);
  });

  socket.on(
    "startSession",
    async (data: { categoryId: string; hostId: string; sessionId: string }) => {
      const { categoryId, hostId, sessionId } = data;
      console.log(`Got start request on socket ${socket.id} for category ${categoryId} with host ${hostId}`);
      await startNewRound(sessionId, categoryId);
    }
  );

  socket.on("disconnect", () => {
    console.log(`Client ${socket.id} disconnected`);
  });
});

app.get("/", (req: Request, res: Response) => {
  res.status(200).send({ status: "Alright" });
});

// Endpoint to save data sent from a user.
app.post("/category/add", addCategory);

// Endpoint to save data sent from a user.
app.get("/category/get/:categoryId", categoryExists);

// Endpoint to add user to the user database.
app.post("/users/add", addUser);

// Checks if the session for the given category is running.
app.get("/:categoryId/session/running", isSessionRunning);

// Gets an active session for the given category.
app.get("/:categoryId/session/:userId/get", getOrCreateActiveSession);

// Add a user to a session.
app.post("/:categoryId/session/add", addUserToSession);

// Force the start of a new round.
app.post(
  "/:categoryId/session/nextRound",
  async (req: Request, res: Response) => {
    const { categoryId } = req.params;

    const sessionEntry = await SessionData.findOne({ categoryId });

    if (!sessionEntry) {
      console.error("Failed to find session for ", categoryId);
      res.sendStatus(404);
      return;
    }
    await startNewRound(sessionEntry.sessionId, categoryId);
    res.sendStatus(200);
  }
);

app.get("/:categoryId/selection/:round/:userId", getSelection);

app.post("/:categoryId/vote/:winnerId/:loserId", performVote);

app.post("/:categoryId/waiting/remove", async (req: Request, res: Response) => {
  const { categoryId } = req.params;
  const { userId } = req.body;

  const sessionEntry = await SessionData.findOne({ categoryId });

  if (!sessionEntry) {
    console.error("Failed to find session for ", categoryId);
    res.sendStatus(404);
    return;
  }

  const waitingUsers = sessionEntry.waitingIds;
  console.log(`Removing ${userId} from [${waitingUsers}]`);
  waitingUsers.splice(waitingUsers.indexOf(userId), 1);

  if (waitingUsers.length === 0) {
    await startNewRound(sessionEntry.sessionId, categoryId);
  } else {
    await sessionEntry.save();
  }

  res.sendStatus(200);
});

app.get("/:categoryId/aliases", getAliases);

app.get("/:categoryId/names", getNames);

app.get("/:categoryId/mmr", getMmr);

app.get("/:categoryId/:userId/tasted", getTasted);

server.listen(port, "0.0.0.0", 511, () => {
  console.log(`Server running on port ${port}`);
});

function logAwake() {
  console.log("Still running");
}
setInterval(logAwake, 10000);
