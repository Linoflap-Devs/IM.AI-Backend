import express from "express";
import protect from "../middleware/authMiddleware";
import { addBatch, addBatchRemarks, deleteBatch, displayBatch, editBatch, getBatches, getBatchesProduct, getBatchRemarks, storeBatch } from "../controller/controllerBatch";

const router = express.Router();

router.route("/getBatches").get(protect, getBatches)
router.route("/addBatch").post(protect, addBatch)
router.route("/editBatch").patch(protect, editBatch)
router.route("/deleteBatch").delete(protect, deleteBatch)
router.route("/getBatchesProduct").get(protect, getBatchesProduct)
router.route("/displayBatch").patch(protect, displayBatch)
router.route("/storeBatch").patch(protect, storeBatch)
router.route("/getBatchRemarks").get(protect, getBatchRemarks)
router.route("/addBatchRemark").post(protect, addBatchRemarks)

export default router;