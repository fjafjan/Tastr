const mongoose = require('mongoose')
const { Schema } = mongoose

// Define the schema for a FoodObject
const foodObjectSchema = new Schema({
  id: { type: String, required: true }, // Unique identifier for each food item
  name: { type: String, required: true }, // Name of the food item
  voteCount: { type: Number, default: 0 }, // Number of votes for the food item
  MMR: { type: Schema.Types.Decimal128, default: 1000.0 } // MMR (Matchmaking Rating) as a double
});

// Define the schema for StoredData
const storedDataSchema = new Schema({
  sessionId: { type: String, required: true, unique: true }, // Unique session identifier
  foodObjects: { type: [foodObjectSchema], required: true } // Array of FoodObjects
});

const StoredData = mongoose.model('StoredData', storedDataSchema)
// const VoteData = mongoose.model('VoteData', voteDataSchema)

module.exports = {
  StoredData,
}
