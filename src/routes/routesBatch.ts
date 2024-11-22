import express from "express";
import protect from "../middleware/authMiddleware";
import { addBatch, deleteBatch, editBatch, getBatches, getBatchesProduct } from "../controller/controllerBatch";

const router = express.Router();

router.route("/getBatches").get(protect, getBatches)
router.route("/addBatch").post(protect, addBatch)
router.route("/editBatch").patch(protect, editBatch)
router.route("/deleteBatch").delete(protect, deleteBatch)
router.route("/getBatchesProduct").get(protect, getBatchesProduct)

export default router;