const express = require('express')
const http = require('http')
const cors = require('cors')
const socketIo = require('socket.io')
const bodyParser = require('body-parser')
const { default: mongoose } = require('mongoose')
const { FoodCategoryData, VoteData, UserData, SessionData } = require('./Models')
const { PerformVote, CreateCategory, FindTastedItems, CreateSession, GenerateSelections, GetSelection } = require('./DatabaseUtility')

const app = express()
const server = http.createServer(app)
const port = 5000

// Middleware
app.use(cors())
app.use(bodyParser.json())

const io = socketIo(server, {
  cors: {
    origin: "http://localhost:9000", // Ask about this. Seems I should change it to https://fjafjan.github.io
    methods: ["GET", "POST"]
  }
})

let users = {}
let waitingUsers = []
let currentRound = 0

// Connect to database.
mongoose.connect('mongodb://localhost:27017/Tastr').then(() => {
  console.log("Connected to database")
}).catch(err => {
  console.error("Failed to connect to database", err)
  return 1
})

// Ask: How can I add the ID of the user here and on disconnect.
io.on('connection', (socket) => {
  console.log(`New client ${socket.id} connected`);

  socket.on('join', (data) => {
    console.log(`User ${data.userId} has joined`)
    users[socket.id] = data.userId; // TODO: We could store some other field here, but the key is to make the users unique.
  });

  socket.on('startSession', (data) => {
    console.log("Got start request", socket.id)
    const { categoryId: categoryId, hostId: hostId, sessionId: sessionId } = data
    let userIds = Object.values(users)
    console.log(`Starting new voting session for category ${categoryId} with host ${hostId} and users ${userIds}`)
    if(!CreateSession(sessionId, categoryId, hostId, userIds)) {
      console.error("Failed to create new session")
    } else {
      console.log("Created new session")
    }
    // We test generating the first round.
    currentRound = 0
    GenerateSelections(categoryId, userIds, currentRound)

    // Wait for all users to load.
    waitingUsers.push(users)

    io.emit('start');
  });

  socket.on('disconnect', () => {
    console.log(`Client ${socket.id} disconnected`);
    if(socket.id in users) {
      delete users[socket.id]
    }
  });
});


// Endpoint to save data sent from a user.
app.post('/category/add', async(req, res) => {
  const { categoryId: categoryId, foodNames: foodNames } = req.body
  console.log("Creating new category with ", categoryId, foodNames)
  const result = await CreateCategory(categoryId, foodNames)
  if (result) {
    res.sendStatus(200) // Ok!
  } else {
    console.error("Failed to create new category ", categoryId, foodNames)
  }
})

// Endpoint to add user to the user database.
app.post('/users/add', async(req, res) => {
  const { userId: userId, name: name, email: email } = req.body
  console.log("Adding new user", userId, name)
  try {
    UserData.create({
      name: name,
      userId: userId,
      email: email,
    })
    res.sendStatus(200) // Ok!
  } catch(error) {
    console.error("Failed to add user", userId, name, email, error)
    res.sendStatus(404)
  }
})

app.get('/:categoryId/selection/:round/:userId', async (req, res) => {
  const { categoryId, round, userId } = req.params
  console.log(`Requesting vote selection for ${categoryId} round ${round} from user ${userId}`)
  // We could potentially just check the current round here?
  options = await GetSelection(categoryId, userId, round)
  if (options) {
    res.json(options)
  } else {
    res.sendStatus(404)
  }
})

app.post('/:categoryId/vote/:winnerId/:loserId', async (req, res) => {
  const { categoryId, winnerId, loserId} = req.params
  const { userId } = req.body
  console.log(`Got vote for ${winnerId} over ${loserId} in Session ${categoryId}`)
  const result = await PerformVote(userId, categoryId, winnerId, loserId)

  console.log(`Removing ${userId} from ${waitingUsers}`)
  waitingUsers.splice(waitingUsers.indexOf(userId), 1)
  if (waitingUsers.length === 0) {
    console.log("All clients are ready. Preparing next round.")
    // Should move this to a utility function.
    // TODO: This is not sufficient to actually identify the session, but lets leave it for now.
    const sessionEntry = await SessionData.findOne({categoryId: categoryId})
    if (!sessionEntry) {
      console.error("Failed to find session for ", categoryId)
    }
    sessionEntry.round += 1
    let userIds = sessionEntry.tasterIds
    await GenerateSelections(categoryId, userIds, sessionEntry.round)
    waitingUsers.push(userIds)
    io.emit('round ready', { round: sessionEntry.round})
    sessionEntry.save()
  }

  if (result) {
    res.sendStatus(200)
  } else {
    res.sendStatus(500)
  }
})

app.get('/:categoryId/aliases', async (req, res) => {
  const { categoryId } = req.params
  console.log("Getting aliases for category ", categoryId)

  try {
    const entry = await FoodCategoryData.findOne({ categoryId: categoryId }).exec()
    if (entry) {
      const idToAliasDictionary = entry.foodObjects.reduce((acc, item) => {
        acc[item.id] = item.alias
        return acc
      }, {});
      console.log("Returning", idToAliasDictionary)
      res.json(idToAliasDictionary)
    } else {
      res.sendStatus(404) // Not found
    }
  } catch(error) {
    console.error(`Failed to get foods for ${categoryId}`, error)
  }
})

// Endpoint to get data.
app.get('/:categoryId/names', async (req, res) => {
  const { categoryId } = req.params
  console.log("Getting food names for category ", categoryId)

  try {
    const entry = await FoodCategoryData.findOne({ categoryId: categoryId }).exec()
    if (entry) {
      const idToNamesDictionary = entry.foodObjects.reduce((acc, item) => {
        acc[item.id] = item.name
        return acc
      }, {});
      console.log("Returning", idToNamesDictionary)
      res.json(idToNamesDictionary)
    } else {
      res.sendStatus(404) // Not found
    }
  } catch(error) {
    console.error(`Failed to get foods for ${categoryId}`, error)
  }
})

app.get('/:categoryId/mmr', async (req, res) => {
  const { categoryId } = req.params
  console.log("Getting MMR for category", categoryId)
  try {
    const entry = await FoodCategoryData.findOne({ categoryId: categoryId }).exec()
    if (entry) {
      const foodItemsDictionary = entry.foodObjects.reduce((acc, item) => {
        acc[item.name] = item.MMR
        return acc;
      }, {});

      console.log("Returning", foodItemsDictionary)
      res.json(foodItemsDictionary)
    } else {
      res.sendStatus(404) // Not found
    }
  } catch(error) {
    console.error(`Failed to find MMR for ${categoryId}`, error)
  }
})

app.get('/:categoryId/:userId/tasted', async (req, res) => {
  const { categoryId: categoryId, userId: userId } = req.params
  console.log(`Getting the votes in ${categoryId} for ${userId}`)
  const result = await FindTastedItems(categoryId, userId)

  if (result) {
    console.log("Returning tasted map:", result)
    res.json(result)
  } else {
    res.sendStatus(500)
  }
})

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})