import { Request, Response } from "express";
import { UserData } from "../models";

// Add a new user or update existing user details
export const addUser = async (req: Request, res: Response) => {
  const { userId, name, email } = req.body;
  console.log("Adding new user", userId, name);

  try {
    await UserData.findOneAndUpdate(
      { userId: userId }, // Find user by userId
      {
        name: name,
        email: { email: email }, // Update the email directly
      },
      { upsert: true } // Create a new document if no matching document is found
    );
    res.sendStatus(200); // Ok!
  } catch (error) {
    console.error("Failed to add user", userId, name, email, error);
    res.sendStatus(404);
  }
};
