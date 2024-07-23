const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const { default: mongoose } = require('mongoose')
const { StoredData, VoteData } = require('./Models')

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
    await StoredData.findOneAndUpdate({id: sessionId}, {fields}, { upsert: true, new: true})

    let voteEntry = VoteData.findOne({ sessionId: sessionId});
    // Initialize the voting data.
    if (!voteEntry[sessionId]) {
      const votes = {}
      for (let key in fields) {
        votes[key] = 0
      }
      await new VoteData({ sessionId: sessionId, votes}).save()
    }
    res.sendStatus(200) // We are OK!
  } catch(error) {
    console.error("Failed to save new data due to ", error)
  }
})

app.post('/vote/:id/:winner/:loser', async (req, res) => {
  const { id, winner, loser} = req.params
  console.log(`Got vote for ${winner} over ${loser} in Session ${id}`)
  let voteEntry = await VoteData.findOne({ sessionId: id });

  if (voteEntry) {
    voteEntry.votes.set(winner, voteEntry.votes.get(winner) + 1);
    voteEntry.votes.set(loser, voteEntry.votes.get(loser) - 1);
    res.sendStatus(200)
  } else {
    console.log("Some piece of data is missing", thisVote)
    res.sendStatus(404)
  }
})

// Endpoint to get data.
app.get('/foods/:id', async (req, res) => {
  const { id } = req.params
  console.log("Posting data on", id)

  try {
    const entry = await StoredData.findOne({ id }, "fields").exec()
    if (entry) {
      console.log("Returning", entry, entry.fields)
      res.json(entry.fields)
    } else {
      res.sendStatus(404) // Not found
    }
  } catch(error) {
    console.error(`Failed to get foods for ${id}`)
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})