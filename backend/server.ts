import express, { Request, Response } from "express";
import http from "http";
import cors from "cors";
import { Server as SocketIOServer, Socket } from "socket.io";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import { CreateSession, GenerateSelections } from "./database_utility";
import {
  addCategory,
  getAliases,
  getNames,
  getMmr,
} from "./controllers/food_category_controller";
import {
  getTasted,
  performVote,
  getSelection,
  getActiveSession,
  addUserToSession,
} from "./controllers/voting_session_controller";
import { addUser } from "./controllers/user_controller";
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
      console.log("Got start request", socket.id);
      const { categoryId, hostId, sessionId } = data;
      const sessionEntry = await SessionData.findOne({ sessionId });

      if (!sessionEntry) {
        console.error("No session with session Id found!");
        return;
      }

      const tasterIds = sessionEntry.tasterIds;
      console.log(
        `Starting new voting session for category ${categoryId} with host ${hostId} and users ${tasterIds}`
      );

      await GenerateSelections(categoryId, tasterIds, 0);
      io.emit("start");
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

// Endpoint to add user to the user database.
app.post("/users/add", addUser);

// Gets an active session for the given category.
app.get("/:categoryId/session/:userId/get", getActiveSession);

// Add a user to a session.
app.post("/:categoryId/session/add", addUserToSession);

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
  await sessionEntry.save();

  if (waitingUsers.length === 0) {
    console.log("All clients are ready. Preparing next round.");
    sessionEntry.round += 1;
    const userIds = sessionEntry.tasterIds;

    await GenerateSelections(categoryId, userIds, sessionEntry.round);
    io.emit("round ready", { round: sessionEntry.round });
    sessionEntry.waitingIds = sessionEntry.tasterIds;
    await sessionEntry.save();
    res.sendStatus(200);
  }
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
