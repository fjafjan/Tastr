import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// In-memory MongoDB instance
let mongoServer: MongoMemoryServer;

export const connect = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  // Connect mongoose to the in-memory server
  await mongoose.connect(uri, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  });
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
