const express = require('express')
const http = require('http')
const cors = require('cors')
const socketIo = require('socket.io')
const bodyParser = require('body-parser')
const { default: mongoose } = require('mongoose')
const { CreateSession, GenerateSelections } = require('./DatabaseUtility')
const { addCategory, getAliases, getNames, getMmr } = require('./controllers/FoodCategoryController')
const { getTasted, performVote, getSelection } = require('./controllers/VotingSessionController')
const { addUser } = require('./controllers/UsersController')
const { SessionData } = require('./Models')

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

// Connect to database.
mongoose.connect('mongodb://localhost:27017/Tastr').then(() => {
  console.log("Connected to database")
}).catch(err => {
  console.error("Failed to connect to database", err)
  return 1
})

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

    GenerateSelections(categoryId, userIds, 0)

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
app.post('/category/add', addCategory)

// Endpoint to add user to the user database.
app.post('/users/add', addUser)

app.get('/:categoryId/selection/:round/:userId', getSelection)

app.post('/:categoryId/vote/:winnerId/:loserId', performVote)

app.post('/:categoryId/waiting/remove', async (req, res) => {
  const { categoryId: categoryId } = req.params
  const { userId: userId } = req.body
  // TODO I need to find some way of handling IO on the controllers.
  const sessionEntry = await SessionData.findOne({categoryId: categoryId})
  if (!sessionEntry) {
    console.error("Failed to find session for ", categoryId)
    res.sendStatus(404)
  }

  let waitingUsers = sessionEntry.waitingIds
  console.log(`Removing ${userId} from [${waitingUsers}]`)
  waitingUsers.splice(waitingUsers.indexOf(userId), 1)

  if (waitingUsers.length === 0) {
    console.log("All clients are ready. Preparing next round.")
    // Should move this to a utility function.
    // TODO: This is not sufficient to actually identify the session, but lets leave it for now.
    sessionEntry.round += 1
    let userIds = sessionEntry.tasterIds
    await GenerateSelections(categoryId, userIds, sessionEntry.round)
    userIds.forEach(userId => {
      waitingUsers.push(userId)
    });
    io.emit('round ready', { round: sessionEntry.round})
    sessionEntry.save()
    res.sendStatus(200)
  }
})


app.get('/:categoryId/aliases', getAliases)

// Endpoint to get data.
app.get('/:categoryId/names', getNames)

app.get('/:categoryId/mmr', getMmr)

app.get('/:categoryId/:userId/tasted', getTasted)

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})