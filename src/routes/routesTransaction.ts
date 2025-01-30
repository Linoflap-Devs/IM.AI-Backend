import express from "express";
import protect from "../middleware/authMiddleware";
import {
    getTransactions,
    editTransferStatus,
    getTransactionProducts,
    getSales,
    getMonthlySales,
    getStoreActivityDashboard,
    getDashboardData,
    getProductSales,
    getTransaction,
    getTransactionByRef,
    getMonthlyPurchasePrice,
    allowTransactionTransfer,
    testTransaction
} from "../controller/controllerTransaction";
const router = express.Router();

router.route("/getTransactions/cId/:cId/bId/:bId/from/:from/to/:to").get(protect, getTransactions);
router.route("/getTransaction/tId/:tId").get(protect, getTransaction);
router.route("/getTransaction/rNo/:rNo").get(protect, getTransactionByRef);
router.route("/editTransferStatus/id/:id").put(protect, editTransferStatus);
router.route("/getTransactionProducts/tId/:tId").get(getTransactionProducts);
router.route("/getSales/cId/:cId/bId/:bId/from/:from/to/:to").get(getSales);
router.route("/getMonthlySales/cId/:cId/bId/:bId").get(getMonthlySales);
router.route("/getMonthlyPurchasePrice/cId/:cId/bId/:bId").get(getMonthlyPurchasePrice);
router.route("/getStoreActivityDashboard/cId/:cId/bId/:bId/from/:from/to/:to").get(protect, getStoreActivityDashboard);
router.route("/getDashboardData/cId/:cId/bId/:bId/from/:from/to/:to").get(protect, getDashboardData);
router.route("/getProductSales").get(protect, getProductSales)
router.route("/allowTransfer/tId/:tId").patch(protect, allowTransactionTransfer);

router.route('/testTransaction').post(protect, testTransaction);

export default router;
