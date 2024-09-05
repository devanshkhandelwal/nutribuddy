import User from "../models/User.js";
import asyncHandler from "express-async-handler";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config();

const SALT_ROUNDS = 10;

const sendErrorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({ message });
};

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").lean();

  if (!users?.length) {
    return sendErrorResponse(res, 400, "No users found");
  }

  res.json(users);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendErrorResponse(res, 400, "Email and password are required");
  }

  const user = await User.findOne({ email }).exec();

  if (!user) {
    return sendErrorResponse(res, 404, "User not found");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return sendErrorResponse(res, 401, "Invalid password");
  }

  res.json(user);
});

export const getUserById = asyncHandler(async (req, res) => {
  const { _id } = req.query;

  if (!_id) {
    return sendErrorResponse(res, 400, "User ID is required");
  }

  const user = await User.findById(_id).select("-password").lean().exec();

  if (!user) {
    return sendErrorResponse(res, 404, "User not found");
  }

  res.json(user);
});

export const createNewUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return sendErrorResponse(res, 400, "All fields are required");
  }

  const existingUser = await User.findOne({ email }).lean().exec();

  if (existingUser) {
    return sendErrorResponse(res, 409, "Email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const newUser = {
    firstName,
    lastName,
    email,
    password: hashedPassword,
  };

  const createdUser = await User.create(newUser);

  if (createdUser) {
    res
      .status(201)
      .json({ message: `New user ${firstName} ${lastName} created` });
  } else {
    sendErrorResponse(res, 400, "Invalid user data received");
  }
});

export const updateUser = asyncHandler(async (req, res) => {
  const { _id, ...updateFields } = req.query;

  if (!_id) {
    return sendErrorResponse(res, 400, "User ID is required");
  }

  const user = await User.findById(_id).exec();

  if (!user) {
    return sendErrorResponse(res, 404, "User not found");
  }

  const numericFields = [
    "age",
    "calories",
    "protein",
    "heightFeet",
    "heightInches",
    "weight",
  ];

  Object.keys(updateFields).forEach((key) => {
    if (updateFields[key] !== undefined) {
      if (numericFields.includes(key)) {
        user[key] = Number(updateFields[key]);
      } else if (key === "caloriesRange" || key === "proteinRange") {
        user[key] = updateFields[key].map(Number);
      } else {
        user[key] = updateFields[key];
      }
    }
  });

  const updatedUser = await user.save();

  res.json(updatedUser);
});

export const deleteUser = asyncHandler(async (req, res) => {
  const { _id } = req.body;

  if (!_id) {
    return sendErrorResponse(res, 400, "User ID is required");
  }

  const user = await User.findById(_id).exec();

  if (!user) {
    return sendErrorResponse(res, 404, "User not found");
  }

  const result = await user.deleteOne();

  res.json(
    `User ${result.firstName} ${result.lastName} with ID ${result._id} deleted`
  );
});

export const getDailyTracking = asyncHandler(async (req, res) => {
  const { _id, date } = req.query;

  if (!_id || !date) {
    return sendErrorResponse(res, 400, "User ID and date are required");
  }

  const user = await User.findById(_id).exec();

  if (!user) {
    return sendErrorResponse(res, 404, "User not found");
  }

  const tracking = user.dailyTracking.find(
    (tracking) => tracking.date.toDateString() === new Date(date).toDateString()
  );

  if (!tracking) {
    return sendErrorResponse(
      res,
      404,
      "Tracking entry not found for the given date"
    );
  }

  res.json(tracking);
});

export const createOrUpdateDailyTracking = asyncHandler(async (req, res) => {
  const { userId, date, weight, caloriesConsumed, proteinConsumed } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const trackingIndex = user.dailyTracking.findIndex((tracking) =>
      tracking.date
        .toISOString()
        .startsWith(new Date(date).toISOString().split("T")[0])
    );

    if (trackingIndex > -1) {
      user.dailyTracking[trackingIndex].weight =
        weight !== undefined
          ? weight
          : user.dailyTracking[trackingIndex].weight;

      user.dailyTracking[trackingIndex].caloriesConsumed +=
        caloriesConsumed || 0;
      user.dailyTracking[trackingIndex].proteinConsumed += proteinConsumed || 0;
    } else {
      user.dailyTracking.push({
        date: new Date(date),
        weight,
        caloriesConsumed,
        proteinConsumed,
        caloriesNeeded: user.calories,
        proteinNeeded: user.protein,
      });
    }

    await user.save();

    res
      .status(200)
      .json(
        user.dailyTracking[trackingIndex] ||
          user.dailyTracking[user.dailyTracking.length - 1]
      );
  } catch (error) {
    console.error("Error in createOrUpdateDailyTracking:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export const deleteDailyTracking = asyncHandler(async (req, res) => {
  const { userId, date } = req.query;
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  user.dailyTracking = user.dailyTracking.filter(
    (tracking) => tracking.date.toDateString() !== new Date(date).toDateString()
  );

  await user.save();
  res.json({ message: "Daily tracking deleted successfully" });
});
