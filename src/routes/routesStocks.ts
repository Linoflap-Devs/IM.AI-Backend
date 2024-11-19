import express from "express";
import { addStock, getStocks } from "../controller/controllerStocks";
import protect from "../middleware/authMiddleware";
const router = express.Router();

router.route("/getStocks/cId/:cId/bId/:bId").get(protect, getStocks);
router.route("/addStocks").post(protect, addStock);
router.route("/test").get(protect, (req, res) => {
    res.send("Testt")
})


export default router;