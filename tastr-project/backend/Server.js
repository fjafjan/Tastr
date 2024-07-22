const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const app = express()
const port = 5000

// TODO: Replace this with a database, will ask for this soon.
let storedData = {}

app.use(cors()) // What does this do?
app.use(bodyParser.json())

// Endpoint to save data sent from a user.
app.post('/save', (req, res) => {
  const { id, fields } = req.body
  storedData[id] = fields
  res.sendStatus(200) // We are OK!
})

// Endpoint to get data.
app.get('/foods/:id', (req, res) => {
  const { id } = req.params
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