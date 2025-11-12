import express from "express";
import { signupUser, signinUser } from "../controllers/usersController.js";

const userRouter = express.Router();

userRouter.post("/signup", signupUser);
userRouter.post("/signin", signinUser);

export default userRouter;
