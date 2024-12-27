import express from "express";
import { addStock, getStocks, getStockByProduct, getStockAdjustments, addStockAdjustment, getStockAdjustmentTypes } from "../controller/controllerStocks";
import protect from "../middleware/authMiddleware";
const router = express.Router();

router.route("/getStocks/cId/:cId/bId/:bId").get(protect, getStocks);
router.route("/addStocks").post(protect, addStock);
router.route("/getStocks/cId/:cId/bId/:bId/pId/:pId").get(protect, getStockByProduct);
router.route("/getStockAdjustments/bId/:bId").get(protect, getStockAdjustments);
router.route("/getStockAdjustmentTypes").get(protect, getStockAdjustmentTypes);
router.route("/addStockAdjustments").post(protect, addStockAdjustment);
router.route("/test").get(protect, (req, res) => {
    res.send("Testt")
})


export default router;