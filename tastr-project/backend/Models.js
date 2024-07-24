const mongoose = require('mongoose')
const { Schema } = mongoose

// Define the schema for a FoodObject
const foodObjectSchema = new Schema({
  id: { type: String, required: true }, // Unique identifier for each food item
  name: { type: String, required: true }, // Name of the food item
  alias: { type: String, required: true }, // Alias displayed to the user to hide the identity.
  voteCount: { type: Number, default: 0 }, // Number of votes for the food item
  MMR: { type: Schema.Types.Number, default: 1000.0 } // MMR (Matchmaking Rating) as a double
});

// Define the schema for Food categories, e.g. Wines, Meats, Cinnamon buns etc.
const foodCategorySchema = new Schema({
  categoryId: { type: String, required: true, unique: true }, // Unique category identifier
  foodObjects: { type: [foodObjectSchema], required: true } // Array of FoodObjects
});

const emailSchema = new Schema({
  email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: 'Email address is required',
      validate: [validateEmail, 'Please fill a valid email address'],
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  }
})

// This defines the data for an individual vote. This allows us to e.g. remove malicious users
// and generate sub-section preferences. So we store each individual vote instead of storing it
// per item.
const voteSchema = new Schema({
  voteId: {type: String, required: true, unique: true}, // Uniquely identifies this vote.
  userId: {type: String, required: true }, // Who did the voting.
  categoryId: { type: String, required: true} , // What was the category.
  winnerId: { type: String, required: true }, // Who was chosen as the winner.
  loserId: { type: String, required: true }, // Who was voted against.
});

// This will likely change a bit in the future.
const userSchema = new Schema({
  userId: {type: String, required: true, unique: true}, // Uniquely identifies the user
  name: {type: String, required: true}, // A more descriptive name of the user.
  email: {type: emailSchema, default: "fake@fakemail.fk"}, // An email to the user, which allows us to notify them by email after testing is done.
})

// We need something which ties together:
// The category schema, i.e. what food is being tested.
// The user schema, which users are participating.
// The host ID, who is allowed to declare it done.
// Maybe some optional name, and the URL.

const FoodCategoryData = mongoose.model('FoodCategoryData', foodCategorySchema)
const VoteData = mongoose.model('VoteData', voteSchema)
const UserData = mongoose.model("UserData", userSchema)

module.exports = {
  FoodCategoryData,
  VoteData,
  UserData,
}
