import { GoogleGenerativeAI } from "@google/generative-ai";
import User from "../models/User.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const openai = new OpenAI({
  baseURL: process.env.LLAMA_BASE_URL,
  apiKey: process.env.LLAMA_API_KEY,
});

async function main(content) {
  const completion = await openai.chat.completions.create({
    model: "meta-llama/llama-3.1-8b-instruct:free",
    messages: [{ role: "user", content: content }],
  });

  console.log(completion.choices[0].message);
}
main();

const SALT_ROUNDS = 10;
const DEFAULT_CALORIES = 2000;

const sendErrorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({ message });
};

export const getRecipes = asyncHandler(async (req, res) => {
  const {
    _id,
    amount_of_servings,
    cuisine,
    prep_time,
    kitchen_equipment,
    meal_type,
    flavor_preferences,
    additional_notes,
  } = req.query;

  if (!_id) {
    return sendErrorResponse(res, 400, "User ID is required");
  }

  const servings = amount_of_servings || 1;
  const user = await User.findById(_id).exec();

  if (!user) {
    return sendErrorResponse(res, 404, "User not found");
  }

  const dietaryRestrictions = user.dietaryRestrictions || [];
  const pantryItems = user.pantryItems.map((item) => item.name);

  if (!pantryItems.length) {
    return sendErrorResponse(res, 400, "No pantry items found");
  }

  const prompt = `
  Create a recipe in JSON format for ${servings} servings, using a minimal selection of these ingredients to make a filling meal: ${pantryItems.join(
    ", "
  )}.
  Use as few ingredients as possible while still creating a satisfying dish.
  Prioritize ingredients closest to expiring, but don't use any that have already expired.
  Consider these dietary restrictions: ${dietaryRestrictions.join(", ")}.
  Additional parameters to consider:
  - Cuisine preference: ${cuisine || "None"} 
  - Preparation time: ${prep_time || "No preference"} 
  - Kitchen equipment limitations: ${kitchen_equipment || "None"} 
  - Meal type: ${meal_type || "Any"} 
  - Flavor preferences: ${flavor_preferences || "None"} 
  - Additional notes: ${additional_notes || "None"} 

  IMPORTANT: Use EXACTLY the same names and same quantity unit for ingredients as provided in the pantry list. Do not modify, expand, or specify further details for ingredient names. For example, if "Chicken Thighs" is in the pantry, use "Chicken Thighs" in the recipe, not "Boneless Chicken Thighs" or any other variation. And if the pantry list specifies "200 g Chicken Thighs", use "200 g Chicken Thighs" in the recipe, not "2 pieces Chicken Thighs" or any other variation.

  The JSON should strictly adhere to this structure: 
  {
    "name": "Recipe Name",
    "servings": ${servings},
    "totalTime": 30,
    "ingredients": [
      { "name": "Ingredient 1", "quantity": 1, "unit": "cup" },
      { "name": "Ingredient 2", "quantity": 200, "unit": "g" }
    ],
    "instructions": [
      { "step": "Detailed instruction for step 1." },
      { "step": "Detailed instruction for step 2." }
    ],
    "nutritionPerServing": {
      "calories": 300,
      "protein": 20,
      "carbs": 30,
      "fat": 10
    },
    "additionalNotes": "Any additional notes"
  }
  Ensure all numeric values are integers. 
  Provide accurate estimates for the nutritional information based on the ingredients and serving size. 
  For any ingredient, specify the quantity consistently either in grams (e.g., 200 g chicken thighs) or in pieces (e.g., 2 pieces chicken thighs). Convert all quantities to either grams or pieces depending on the context of the recipe. 
  Return only the JSON object, with no additional text before or after. 
  Ensure the JSON is valid and can be parsed without errors.
`;

  const completion = await openai.chat.completions.create({
    model: "meta-llama/llama-3.1-8b-instruct:free",
    messages: [{ role: "user", content: prompt }],
  });

  console.log(completion.choices[0].message);
  const firstCandidate = completion.choices[0].message;
  const recipe = firstCandidate.content;

  res.json(recipe);
});
