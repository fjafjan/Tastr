const express = require("express");
const http = require("http");
const cors = require("cors");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const { default: mongoose } = require("mongoose");
const { CreateSession, GenerateSelections } = require("./DatabaseUtility");
const {
  addCategory,
  getAliases,
  getNames,
  getMmr,
} = require("./controllers/FoodCategoryController");
const {
  getTasted,
  performVote,
  getSelection,
  getActiveSession,
  addUserToSession,
} = require("./controllers/VotingSessionController");
const { addUser } = require("./controllers/UsersController");
const { SessionData } = require("./Models");

const app = express();

const server = http.createServer(app);
const port = process.env.REST_PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

const io = socketIo(server, {
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
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Connected to database");
  })
  .catch((err) => {
    console.error("Failed to connect to database", err);
    return 1;
  });

io.on("connection", (socket) => {
  console.log(`New client ${socket.id} connected`);

  socket.on("join", (data) => {
    console.log(`User ${data.userId} has joined`);
  });

  socket.on("startSession", async (data) => {
    console.log("Got start request", socket.id);
    const {
      categoryId: categoryId,
      hostId: hostId,
      sessionId: sessionId,
    } = data;
    let sessionEntry = await SessionData.findOne({ sessionId: sessionId });
    if (!sessionEntry) {
      console.error("No session with session Id found!");
    }
    let tasterIds = sessionEntry.tasterIds;

    console.log(
      `Starting new voting session for category ${categoryId} with host ${hostId} and users ${tasterIds}`
    );
    await GenerateSelections(categoryId, tasterIds, 0);

    io.emit("start");
  });

  // Remove this?
  socket.on("disconnect", () => {
    console.log(`Client ${socket.id} disconnected`);
  });
});

app.get("/", (req, res) => {
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

app.post("/:categoryId/waiting/remove", async (req, res) => {
  const { categoryId: categoryId } = req.params;
  const { userId: userId } = req.body;
  // TODO I need to find some way of handling IO on the controllers.
  const sessionEntry = await SessionData.findOne({ categoryId: categoryId });
  if (!sessionEntry) {
    console.error("Failed to find session for ", categoryId);
    res.sendStatus(404);
    return;
  }

  let waitingUsers = sessionEntry.waitingIds;
  console.log(`Removing ${userId} from [${waitingUsers}]`);
  waitingUsers.splice(waitingUsers.indexOf(userId), 1);

  if (waitingUsers.length === 0) {
    console.log("All clients are ready. Preparing next round.");
    // Should move this to a utility function.
    // TODO: This is not sufficient to actually identify the session, but lets leave it for now.
    sessionEntry.round += 1;
    let userIds = sessionEntry.tasterIds;
    await GenerateSelections(categoryId, userIds, sessionEntry.round);
    userIds.forEach((userId) => {
      waitingUsers.push(userId);
    });
    io.emit("round ready", { round: sessionEntry.round });
    sessionEntry.save();
    res.sendStatus(200);
  }
});

app.get("/:categoryId/aliases", getAliases);

// Endpoint to get data.
app.get("/:categoryId/names", getNames);

app.get("/:categoryId/mmr", getMmr);

app.get("/:categoryId/:userId/tasted", getTasted);

server.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});

function logAwake() {
  console.log("Still running");
}
setInterval(logAwake, 10000);
