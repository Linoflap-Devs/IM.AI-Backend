import express from "express";
import protect from "../middleware/authMiddleware";
import { getClientActivity } from "../controller/controllerClientActivity";
const router = express.Router();

router.route("/getClientActivity/from/:from/to/:to").get(getClientActivity);



export default router;

