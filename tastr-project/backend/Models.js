const mongoose = require('mongoose')
const { Schema } = mongoose

const storedDataSchema = new Schema({
  sessionId: { type: String, required: true, unique: true},
  fields: { type: Map, of: String, required: true}
});

const voteDataSchema = new Schema({
  sessionId: { type: String, required: true, unique: true},
  votes: { type: Map, of: Number, default: {}}
})

const StoredData = mongoose.model('StoredData', storedDataSchema)
const VoteData = mongoose.model('VoteData', voteDataSchema)

module.exports = {
  StoredData,
  VoteData,
}
