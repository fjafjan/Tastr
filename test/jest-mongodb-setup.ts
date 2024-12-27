import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// In-memory MongoDB instance
let mongoServer: MongoMemoryServer;

export const connect = async () => {
  console.time("Connecting")
  console.timeLog("Connecting", "Starting connection")
  mongoServer = await MongoMemoryServer.create();
  console.timeLog("Connecting", "Created")
  const uri = mongoServer.getUri();
  console.timeLog("Connecting", "Uri")

  // Connect mongoose to the in-memory server
  await mongoose.connect(uri, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  });
  console.timeLog("Connecting", "Connected")
  console.timeEnd("Connecting")
};

export const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};
