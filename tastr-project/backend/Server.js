const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const { default: mongoose } = require('mongoose')
const { StoredData } = require('./Models')

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
app.post('/save', async(req, res) => {
  const { id: sessionId, fields } = req.body
  console.log("Received data on", sessionId, fields)
  try {
    const foodObjects = Object.keys(fields).map((key, index) => ({
      id: key,
      name: fields[key],
      voteCount: 0,
      MMR: 1000, // Default MMR
    }))
    await StoredData.findOneAndUpdate(
      {sessionId: sessionId},
      { $set : { foodObjects: foodObjects} },
      { upsert: true, new: true}
    );
    res.sendStatus(200) // We are OK!
  } catch(error) {
    console.error("Failed to save new data due to ", error)
  }
})

app.post('/vote/:sessionId/:winnerId/:loserId', async (req, res) => {
  const { sessionId, winnerId, loserId} = req.params
  console.log(`Got vote for ${winnerId} over ${loserId} in Session ${sessionId}`)
  const entry = await StoredData.findOne({ sessionId: sessionId }).exec();
  if (!entry) {
    console.error("Failed to find session ID ", sessionId)
    res.sendStatus(404)
    throw new Error("Failed to find session ID", sessionId)
  }

  const winnerEntry = entry.foodObjects.find(food => food.id === winnerId)
  const loserEntry = entry.foodObjects.find(food => food.id === loserId)

  if (typeof(winnerEntry) === "undefined" || typeof(loserEntry) === "undefined") {
    console.error(`Missing entry with id ${loserId} or ${winnerId}`)
    res.sendStatus(404)
    return;
  }
  winnerEntry.voteCount = winnerEntry.voteCount + 1
  loserEntry.voteCount = loserEntry.voteCount - 1
  entry.save()
  res.sendStatus(200)
})

// Endpoint to get data.
app.get('/names/:sessionId', async (req, res) => {
  const { sessionId } = req.params
  console.log("Getting food names for session ", sessionId)

  try {
    const entry = await StoredData.findOne({ sessionId: sessionId }).exec()
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
app.get('/votes/:sessionId', async (req, res) => {
  const { sessionId } = req.params
  console.log("Getting votes for session ", sessionId)
  try {
    const entry = await StoredData.findOne({ sessionId: sessionId }).exec()
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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})