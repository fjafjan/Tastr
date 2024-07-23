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

const StoredData = mongoose.model('StoredData', storedDataSchema)
const VoteData = mongoose.model('VoteData', voteSchema)
const UserData = mongoose.model("UserData", userSchema)

// const VoteData = mongoose.model('VoteData', voteDataSchema)

module.exports = {
  StoredData,
  VoteData,
  UserData,
}
