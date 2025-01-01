import express from "express";
import {
  getAllUsers,
  getUserById,
  createNewUser,
  updateUser,
  deleteUser,
  login,
  createOrUpdateDailyTracking,
  deleteDailyTracking,
  getDailyTracking,
} from "../controllers/usersController.js";
import {
  getPantryItems,
  addPantryItem,
  updatePantryItem,
  deletePantryItem,
} from "../controllers/pantryController.js";
import { getRecipes } from "../controllers/recipeController.js";

const router = express.Router();

//base url is users
router
  .route("/")
  .get(getAllUsers)
  .post(createNewUser)
  .patch(updateUser)
  .delete(deleteUser);

router
  .route("/pantry")
  .get(getPantryItems)
  .post(addPantryItem)
  .patch(updatePantryItem)
  .delete(deletePantryItem);

router
  .route("/dailyTracking")
  .get(getDailyTracking)
  .post(createOrUpdateDailyTracking)
  .delete(deleteDailyTracking);

router.route("/getUser").get(getUserById);

router.route("/getRecipes").get(getRecipes);

router.route("/auth/login").post(login);

export default router;
