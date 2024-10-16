import express from "express";
import protect from "../middleware/authMiddleware";
import {
    logIn,
    register,
    protectedRoute,
} from "../controller/controllerUserAdmin";

const router = express.Router();

router.route("/protect").get(protect, protectedRoute);

router.route("/login").post(logIn);
router.route("/register").post(register);

export default router;
