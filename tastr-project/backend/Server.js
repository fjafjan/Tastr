const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const { default: mongoose } = require('mongoose')
const { FoodCategoryData, VoteData, UserData } = require('./Models')
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
  const { categoryId: categoryId, foodNames: foodNames } = req.body
  console.log("Creating new category with ", categoryId, foodNames)
  const result = await CreateSession(categoryId, foodNames)
  if (result) {
    res.sendStatus(200) // Ok!
  } else {
    console.error("Failed to create new category ", categoryId, foodNames)
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

app.post('/:categoryId/vote/:winnerId/:loserId', async (req, res) => {
  const { categoryId, winnerId, loserId} = req.params
  const { userId } = req.body
  console.log(`Got vote for ${winnerId} over ${loserId} in Session ${categoryId}`)
  const result = await PerformVote(userId, categoryId, winnerId, loserId)
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

// Endpoint to get votes.
app.get('/:categoryId/votes', async (req, res) => {
  const { categoryId } = req.params
  console.log("Getting votes for category ", categoryId)
  try {
    const entry = await FoodCategoryData.findOne({ categoryId: categoryId }).exec()
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
    console.error(`Failed to find votes for ${categoryId}`, error)
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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})