import express from "express";
import protect from "../middleware/authMiddleware";
import {
    getPushCart,
    getPushCartReport,
    addPushCartReport,
    getUnusualTransactions,
    addUnusualTransaction,
    resolveUnusualCart,
} from "../controller/controllerPushCart";
const router = express.Router();

router.route("/getPushCart/cId/:cId/bId/:bId").get(protect, getPushCart);
router.route("/getPushCartReport").post(getPushCartReport);
router.route("/addPushCartReport").post(protect, addPushCartReport);
router.route("/addUnusualTransaction").post(protect, addUnusualTransaction);
router.route("/getUnusualTransactions/cId/:cId/bId/:bId").get(protect, getUnusualTransactions);
router.route("/resolveUnusualTransaction/utId/:utId").patch(protect, resolveUnusualCart);
export default router;
