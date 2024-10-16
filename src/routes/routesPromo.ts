import express from "express";
import protect from "../middleware/authMiddleware";
import { getPromo, addPromo, deletePromo, getPromoProducts } from "../controller/controllerPromo";
const router = express.Router();

router.route("/getPromo/cId/:cId/bId/:bId").get(protect, getPromo);
router.route("/addPromo").post(protect, addPromo);
router.route("/deletePromo/id/:id").delete(protect, deletePromo);
router.route("/getPromoProducts/pId/:pId").get(getPromoProducts);
export default router;
