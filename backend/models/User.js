import mongoose from "mongoose";

const pantryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  unit: {
    type: String,
    enum: [
      "Piece",
      "g",
      "kg",
      "oz",
      "lb",
      "Slice",
      "Cup",
      "tbsp",
      "tsp",
      "ml",
      "l",
      "fl oz",
    ],
    required: true,
  },
  expirationDate: {
    type: Date,
    default: null,
  },
});

const dailyTrackingSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  weight: {
    type: Number,
    default: null,
  },
  caloriesConsumed: {
    type: Number,
    default: 0,
  },
  caloriesNeeded: {
    type: Number,
    default: null,
  },
  proteinConsumed: {
    type: Number,
    default: 0,
  },
  proteinNeeded: {
    type: Number,
    default: null,
  },
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    default: "",
  },
  password: {
    type: String,
    required: true,
  },
  dateJoined: {
    type: Date,
    default: Date.now,
  },
  pantryItems: {
    type: [pantryItemSchema],
    default: [],
  },
  active: {
    type: Boolean,
    default: true,
  },
  dietaryRestrictions: {
    type: [String],
    default: [],
  },
  goals: {
    type: String,
    enum: [
      "Lose Fat",
      "Gain Muscle",
      "Maintain Muscle",
      "Maintain Weight",
      "Gain Muscle & Lose Fat",
    ],
    default: "Maintain Muscle",
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },
  calories: {
    type: Number,
    default: 2000,
  },
  protein: {
    type: Number,
    default: 80,
  },
  proteinRange: {
    type: [Number],
    default: [80, 80],
  },
  caloriesRange: {
    type: [Number],
    default: [2000, 2000],
  },
  weight: {
    type: Number,
    default: null,
  },
  heightFeet: {
    type: Number,
    default: null,
  },
  heightInches: {
    type: Number,
    default: null,
  },
  system: {
    type: String,
    enum: ["Metric", "Imperial"],
    default: "Metric",
  },
  dailyTracking: {
    type: [dailyTrackingSchema],
    default: [],
  },
  foodPreferences: {
    type: [String],
    default: [],
  },
  activityLevel: {
    type: String,
    enum: [
      "Sedentary",
      "Lightly active",
      "Moderately active",
      "Very active",
      "Super active",
    ],
    default: "Moderately active",
  },
  age: {
    type: Number,
    default: null,
  },
  weightUnit: {
    type: String,
    enum: ["kg", "lbs"],
    default: "kg",
  },
  challenge: {
    type: String,
    enum: [
      "1 week",
      "2 weeks",
      "3 weeks",
      "4 weeks",
      "8 weeks",
      "16 weeks",
      "26 weeks",
      "52 weeks",
    ],
    default: "1 week",
  },
});

export default mongoose.model("User", userSchema);
