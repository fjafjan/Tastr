import mongoose, { Document, Model, Schema } from "mongoose";

// Define the interface for FoodObject
interface IFoodObject extends Document {
  id: string;
  name: string;
  alias: string;
  MMR: number;
}

// Define the schema for a FoodObject
const foodObjectSchema = new Schema<IFoodObject>({
  id: { type: String, required: true }, // Unique identifier for each food item
  name: { type: String, required: true }, // Name of the food item
  alias: { type: String, required: true }, // Alias displayed to the user to hide the identity.
  MMR: { type: Schema.Types.Number, default: 1000.0 }, // MMR (Matchmaking Rating) as a double
});
foodObjectSchema.index({ id: 1})

// Define the interface for FoodCategory
export interface IFoodCategory extends Document {
  categoryId: string;
  foodObjects: IFoodObject[];
}

// Define the schema for Food categories, e.g. Wines, Meats, Cinnamon buns, etc.
const foodCategorySchema = new Schema<IFoodCategory>({
  categoryId: { type: String, required: true, unique: true }, // Unique category identifier
  foodObjects: { type: [foodObjectSchema], required: true }, // Array of FoodObjects
});
foodCategorySchema.index({ categoryId: 1})

// Email validation regex
const validateEmail = (email: string): boolean => {
  const re = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email);
};

// Define the interface for email
interface IEmail extends Document {
  email: string;
}

// Define the schema for Email
const emailSchema = new Schema<IEmail>({
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: validateEmail,
      message: "Please enter a valid email",
    },
    required: [true, "Email required"],
  },
});

// Define the interface for Vote
export interface IVote extends Document {
  voteId: string;
  userId: string;
  categoryId: string;
  sessionId: string;
  round: number;
  winnerId: string;
  loserId: string;
}

// Define the schema for Vote
const voteSchema = new Schema<IVote>({
  voteId: { type: String, required: true, unique: true }, // Uniquely identifies this vote
  userId: { type: String, required: true }, // Who did the voting
  categoryId: { type: String, required: true }, // What was the category
  sessionId: { type: String, required: true }, // Which session was the vote in.
  round: {type: Number, required: true}, // Which round the vote was cast in
  winnerId: { type: String, required: true }, // Who was chosen as the winner
  loserId: { type: String, required: true }, // Who was voted against
});

voteSchema.index({voteId: 1})

// Define the interface for User
interface IUser extends Document {
  userId: string;
  name: string;
  email?: IEmail;
}

// Define the schema for User
const userSchema = new Schema<IUser>({
  userId: { type: String, required: true, unique: true }, // Uniquely identifies the user
  name: { type: String, required: true }, // A more descriptive name of the user
  email: { type: emailSchema, default: { email: "fake@fakemail.fk" } }, // An email to the user, for notifications
});
userSchema.index({ userId: 1})

// Define the interface for Session
export interface ISession extends Document {
  sessionId: string;
  categoryId: string;
  tasterIds: string[];
  hostId: string;
  url: string;
  name: string;
  active: boolean;
  round: number;
}

// Define the schema for Session
const sessionSchema = new Schema<ISession>({
  sessionId: { type: String, required: true, unique: true },
  categoryId: { type: String, required: true },
  tasterIds: [{ type: String }],
  hostId: { type: String, required: true },
  url: { type: String, default: "" },
  name: { type: String, default: "" },
  active: { type: Boolean, default: false },
  round: { type: Number, default: 0 },
});
sessionSchema.index({ sessionId: 1})

// Define the interface for Choice
interface IChoice extends Document {
  foodIdA: string;
  foodIdB: string;
}

// Define the schema for Choice
const choiceSchema = new Schema<IChoice>({
  foodIdA: { type: String, required: true },
  foodIdB: { type: String, required: true },
});

// Define the interface for Selection
export interface ISelection extends Document {
  categoryId: string;
  tasterId: string;
  round: number;
  choice: IChoice;
}

// Define the schema for Selection
const selectionSchema = new Schema<ISelection>({
  categoryId: { type: String, required: true },
  tasterId: { type: String, required: true },
  round: { type: Number, required: true },
  choice: { type: choiceSchema, required: true },
});

// Export the models with types
const FoodCategoryData: Model<IFoodCategory> = mongoose.model(
  "FoodCategoryData",
  foodCategorySchema
);
const VoteData: Model<IVote> = mongoose.model("VoteData", voteSchema);
const UserData: Model<IUser> = mongoose.model("UserData", userSchema);
const SessionData: Model<ISession> = mongoose.model(
  "SessionData",
  sessionSchema
);
const SelectionData: Model<ISelection> = mongoose.model(
  "SelectionData",
  selectionSchema
);

export { FoodCategoryData, SelectionData, SessionData, UserData, VoteData };

