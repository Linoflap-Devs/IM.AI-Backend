import express from "express";
import protect from "../middleware/authMiddleware";
import { getCompanyOptions } from "../controller/controllerCompany";
const router = express.Router();


router.route("/getCompanyOptions").get(protect, getCompanyOptions);


export default router;
