import User from "../models/User.js";
import asyncHandler from "express-async-handler";
import dotenv from "dotenv";

dotenv.config();

const SALT_ROUNDS = 10;
const DEFAULT_CALORIES = 2000;

const sendErrorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({ message });
};

export const getPantryItems = asyncHandler(async (req, res) => {
  const { _id } = req.query;

  if (!_id) {
    return sendErrorResponse(res, 400, "User ID is required");
  }

  const user = await User.findById(_id).exec();

  if (!user) {
    return sendErrorResponse(res, 404, "User not found");
  }

  res.json(user.pantryItems);
});

export const addPantryItem = asyncHandler(async (req, res) => {
  const { _id, name, quantity, unit, expiresIn } = req.body;

  if (!_id || !name || !quantity || !unit) {
    return sendErrorResponse(res, 400, "All fields are required");
  }

  const user = await User.findById(_id).exec();

  if (!user) {
    return sendErrorResponse(res, 404, "User not found");
  }

  const pantryItem = {
    name,
    quantity,
    unit,
  };

  if (expiresIn) {
    const expiresInDays = Number(expiresIn);

    if (isNaN(expiresInDays) || expiresInDays <= 0) {
      return sendErrorResponse(res, 400, "Invalid expiresIn value");
    }

    let expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + expiresInDays);

    pantryItem.expirationDate = expirationDate.toISOString(); // Save as ISO string
  }

  user.pantryItems.push(pantryItem);

  const updatedUser = await user.save();

  res.status(201).json(updatedUser.pantryItems);
});

export const updatePantryItem = asyncHandler(async (req, res) => {
  const { _id, name, quantity, unit, expiresIn } = req.body;

  if (!_id || !name || !quantity || !unit) {
    return sendErrorResponse(
      res,
      400,
      "All fields except expiresIn are required"
    );
  }

  const expiresInNumber =
    expiresIn !== undefined && expiresIn !== null ? Number(expiresIn) : null;
  const quantityNumber = Number(quantity);

  if (isNaN(quantityNumber) || quantityNumber <= 0) {
    return sendErrorResponse(
      res,
      400,
      "Invalid value for quantity, must be greater than 0"
    );
  }

  if (
    expiresInNumber !== null &&
    (isNaN(expiresInNumber) || expiresInNumber <= 0)
  ) {
    return sendErrorResponse(
      res,
      400,
      "Invalid value for expiresIn, must be greater than 0 if provided"
    );
  }

  const user = await User.findById(_id).exec();

  if (!user) {
    return sendErrorResponse(res, 404, "User not found");
  }

  const expirationDate = expiresInNumber !== null ? new Date() : null;
  if (expirationDate) {
    expirationDate.setDate(expirationDate.getDate() + expiresInNumber);
  }

  const itemIndex = user.pantryItems.findIndex((item) => item.name === name);

  if (itemIndex === -1) {
    user.pantryItems.push({
      name,
      quantity: quantityNumber,
      unit,
      expirationDate,
    });
  } else {
    user.pantryItems[itemIndex] = {
      name,
      quantity: quantityNumber,
      unit,
      expirationDate,
    };
  }

  const updatedUser = await user.save();

  res.status(200).json(updatedUser.pantryItems);
});

export const deletePantryItem = asyncHandler(async (req, res) => {
  const { _id, name } = req.body;

  if (!_id || !name) {
    return sendErrorResponse(res, 400, "User ID and item name are required");
  }

  const user = await User.findById(_id).exec();

  if (!user) {
    return sendErrorResponse(res, 404, "User not found");
  }

  user.pantryItems = user.pantryItems.filter((item) => item.name !== name);

  const updatedUser = await user.save();

  res.status(200).json(updatedUser.pantryItems);
});
