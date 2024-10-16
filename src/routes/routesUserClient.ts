import express from "express";
import protect from "../middleware/authMiddleware";
import {
    registerOneTimeUser,
    getUserClient,
    loginQr,
} from "../controller/controllerUserClient";
const router = express.Router();

router.route("/registerOTU").post(protect, registerOneTimeUser);
router.route("/getUserClient/cId/:cId/bId/:bId").get(protect, getUserClient);
router.route("/loginQr").post(loginQr);

export default router;
