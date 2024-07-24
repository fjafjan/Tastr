const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const { default: mongoose } = require('mongoose')
const { SessionData, VoteData, UserData } = require('./Models')
const { PerformVote, CreateSession } = require('./DatabaseUtility')

const app = express()
const port = 5000

// Middleware
app.use(cors())
app.use(bodyParser.json())

// Connect to database.
mongoose.connect('mongodb://localhost:27017/Tastr').then(() => {
  console.log("Connected to database")
}).catch(err => {
  console.error("Failed to connect to database", err)
  return 1
})

// Endpoint to save data sent from a user.
app.post('/sessions/add', async(req, res) => {
  const { id: sessionId, fields: foodNames } = req.body
  console.log("Creating new session with ", sessionId, foodNames)
  const result = await CreateSession(sessionId, foodNames)
  if (result) {
    res.sendStatus(200) // Ok!
  } else {
    console.error("Failed to create new session ", sessionId, foodNames)
  }
})

app.post('/users/add', async(req, res) => {
  const { userId: userId, name } = req.body
  console.log("Adding new user", userId, name)
  try {
    UserData.create({
      name: name,
      userId: userId,
    })
    res.sendStatus(200) // Ok!
  } catch(error) {
    console.error("Failed to add user", userId, name, error)
    res.sendStatus(404)
  }
})

app.post('/:sessionId/vote/:winnerId/:loserId', async (req, res) => {
  const { sessionId, winnerId, loserId} = req.params
  const { userId } = req.body
  console.log(`Got vote for ${winnerId} over ${loserId} in Session ${sessionId}`)
  const result = await PerformVote(userId, sessionId, winnerId, loserId)
  if (result) {
    res.sendStatus(200)
  } else {
    res.sendStatus(500)
  }
})

app.get('/:sessionId/aliases', async (req, res) => {
  const { sessionId } = req.params
  console.log("Getting aliases for session ", sessionId)

  try {
    const entry = await SessionData.findOne({ sessionId: sessionId }).exec()
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
    console.error(`Failed to get foods for ${sessionId}`, error)
  }
})

// Endpoint to get data.
app.get('/:sessionId/names', async (req, res) => {
  const { sessionId } = req.params
  console.log("Getting food names for session ", sessionId)

  try {
    const entry = await SessionData.findOne({ sessionId: sessionId }).exec()
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
    console.error(`Failed to get foods for ${sessionId}`, error)
  }
})

// Endpoint to get votes.
app.get('/:sessionId/votes', async (req, res) => {
  const { sessionId } = req.params
  console.log("Getting votes for session ", sessionId)
  try {
    const entry = await SessionData.findOne({ sessionId: sessionId }).exec()
    if (entry) {
      const foodItemsDictionary = entry.foodObjects.reduce((acc, item) => {
        acc[item.name] = item.voteCount
        return acc;
      }, {});

      console.log("Returning", foodItemsDictionary)
      res.json(foodItemsDictionary)
    } else {
      res.sendStatus(404) // Not found
    }
  } catch(error) {
    console.error(`Failed to find votes for ${sessionId}`, error)
  }
})

app.get('/:sessionId/mmr', async (req, res) => {
  const { sessionId } = req.params
  console.log("Getting MMR for session", sessionId)
  try {
    const entry = await SessionData.findOne({ sessionId: sessionId }).exec()
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
    console.error(`Failed to find MMR for ${sessionId}`, error)
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})