import express from "express";
import protect from "../middleware/authMiddleware";
import { getSupplier, addSupplier, editSupplier, getSupplierProducts, deleteSupplier } from "../controller/controllerSupplier";
const router = express.Router();

router.route("/getSuppliers/cId/:cId").get(protect, getSupplier);
router.route("/addSupplier").post(protect, addSupplier);
router.route("/editSupplier").put(protect, editSupplier);
router.route("/deleteSupplier/sId/:sId").delete(protect, deleteSupplier);
router.route("/getSupplierProducts/sId/:sId").get(protect, getSupplierProducts);


export default router;
