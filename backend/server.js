import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import session from "express-session";
import connectDB from "./config/dbConn.js";
import rootRoutes from "./routes/root.js";
import userRoutes from "./routes/userRoutes.js";
import { logEvents, logger } from "./middleware/logger.js";
import errorHandler from "./middleware/errorHandler.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import corsOptions from "./config/corsOptions.js";
import passport from "./config/passportConfig.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3500;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

mongoose.set("strictQuery", false);
connectDB();

app.use(logger);
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/", express.static(path.join(__dirname, "public")));
app.use("/", rootRoutes);
app.use("/users", userRoutes);

app.post("/api/auth/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return res.status(500).json({ message: "Internal server error" });
    if (!user) return res.status(401).json({ message: info.message });
    req.logIn(user, (err) => {
      if (err)
        return res.status(500).json({ message: "Internal server error" });
      return res.json(user);
    });
  })(req, res, next);
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    req.login(newUser, (err) => {
      if (err)
        return res.status(500).json({ message: "Internal server error" });
      res.status(201).json(newUser);
    });
  } catch (err) {
    console.error("Signup error:", err);
    res
      .status(500)
      .json({
        message: "We have encountered an error, please try again.",
        error: err.message,
      });
  }
});

app.get("/api/auth/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "Error logging out" });
    res.json({ message: "Logged out successfully" });
  });
});

app.get("/api/protected", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ message: "You have accessed a protected route!" });
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
});

app.all("*", (req, res) => {
  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

app.use(errorHandler);

mongoose.connection.once("open", () => {
  console.log("Connected to MongoDB");
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
  logEvents(
    `${err.no}: ${err.code}\t${err.syscall}\t${err.hostname}`,
    "mongoErrLog.log"
  );
});
