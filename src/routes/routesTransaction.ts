import express from "express";
import protect from "../middleware/authMiddleware";
import {
    getTransactions,
    editTransferStatus,
    getTransactionProducts,
    getSales,
    getMonthlySales,
    getStoreActivityDashboard,
    getDashboardData
} from "../controller/controllerTransaction";
const router = express.Router();

router.route("/getTransactions/cId/:cId/bId/:bId/from/:from/to/:to").get(protect, getTransactions);
router.route("/editTransferStatus/id/:id").put(protect, editTransferStatus);
router.route("/getTransactionProducts/tId/:tId").get(getTransactionProducts);
router.route("/getSales/cId/:cId/bId/:bId/from/:from/to/:to").get(getSales);
router.route("/getMonthlySales/cId/:cId/bId/:bId").get(getMonthlySales);
router.route("/getStoreActivityDashboard/cId/:cId/bId/:bId/from/:from/to/:to").get(protect, getStoreActivityDashboard);
router.route("/getDashboardData/cId/:cId/bId/:bId/from/:from/to/:to").get(protect, getDashboardData);

export default router;
