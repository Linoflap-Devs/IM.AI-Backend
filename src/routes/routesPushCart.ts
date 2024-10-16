import express from "express";
import protect from "../middleware/authMiddleware";
import {
    getPushCart,
    getPushCartReport,
    addPushCartReport,
} from "../controller/controllerPushCart";
const router = express.Router();

router.route("/getPushCart/cId/:cId/bId/:bId").get(protect, getPushCart);
router.route("/getPushCartReport").post(getPushCartReport);
router.route("/addPushCartReport").post(protect, addPushCartReport);
export default router;
