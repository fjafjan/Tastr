const mongoose = require('mongoose')
const { Schema } = mongoose

// Define the schema for a FoodObject
const foodObjectSchema = new Schema({
  id: { type: String, required: true }, // Unique identifier for each food item
  name: { type: String, required: true }, // Name of the food item
  voteCount: { type: Number, default: 0 }, // Number of votes for the food item
  MMR: { type: Schema.Types.Number, default: 1000.0 } // MMR (Matchmaking Rating) as a double
});

// Define the schema for StoredData
const sessionDataSchema = new Schema({
  sessionId: { type: String, required: true, unique: true }, // Unique session identifier
  foodObjects: { type: [foodObjectSchema], required: true } // Array of FoodObjects
});

// This defines the data for an individual vote. This allows us to e.g. remove malicious users
// and generate sub-section preferences. So we store each individual vote instead of storing it
// per item.
const voteSchema = new Schema({
  voteId: {type: String, required: true, unique: true}, // Uniquely identifies this vote.
  userId: {type: String, required: true }, // Who did the voting.
  sessionId: { type: String, required: true} , // What was the category.
  winnerId: { type: String, required: true }, // Who was chosen as the winner.
  loserId: { type: String, required: true }, // Who was voted against.
});

// This will likely change a bit in the future.
const userSchema = new Schema({
  userId: {type: String, required: true, unique: true}, // Uniquely identifies the user
  name: {type: String, required: true} // A more descriptive name of the user.
})

const SessionData = mongoose.model('SessionData', sessionDataSchema)
const VoteData = mongoose.model('VoteData', voteSchema)
const UserData = mongoose.model("UserData", userSchema)

module.exports = {
  SessionData,
  VoteData,
  UserData,
}
