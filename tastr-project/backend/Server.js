const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()
const port = 5000

// TODO: Replace this with a database, will ask for this soon.
let storedData = {}
let voteData = {}

app.use(cors()) // What does this do?
app.use(bodyParser.json())

// Endpoint to save data sent from a user.
app.post('/save', (req, res) => {
  const { id, fields } = req.body
  console.log("Received data on", id, fields)
  storedData[id] = fields
  // Initialize the voting data.
  if (!voteData[id]) {
    voteData[id] = {}
    const thisVote = voteData[id]
    for (let key in fields) {
      thisVote[key] = 0
    }
  }
  res.sendStatus(200) // We are OK!
})

app.post('/vote/:id/:winner/:loser', (req, res) => {
  const { id, winner, loser} = req.params
  console.log(`Got vote for ${winner} over ${loser} in Session ${id}`)
  const thisVote = voteData[id]

  if (thisVote && winner in thisVote && loser in thisVote) {
    thisVote[winner] += 1
    thisVote[loser] -= 1
    res.sendStatus(200)
  } else {
    if (!thisVote) {
      console.log("Vote data is missing for this session")
    }
    else if (!(winner in thisVote)) {
      console.log("Missing voter data for the winner")
    }
    else if (!(loser in thisVote)) {
      console.log("Missing voter data for the loser")
    }
    console.log("Some piece of data is missing", thisVote)
    res.sendStatus(404)
  }
})

// Endpoint to get data.
app.get('/foods/:id', (req, res) => {
  const { id } = req.params
  console.log("Posting data on", id)
  const fields = storedData[id]
  if (fields) {
    res.json(fields)
  } else {
    res.sendStatus(404) // Not found
  }
})

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})