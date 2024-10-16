import express from "express";
import {
    getBranches,
    addBranches,
    deleteBranch,
    editBranch,
    getBranchesOption,
} from "../controller/controllerBranch";
import protect from "../middleware/authMiddleware";

const router = express.Router();

router.route("/getBranches/cId/:cId").get(getBranches);
router.route("/addBranches").post(addBranches);
router.route("/deleteBranch/id/:id").delete(deleteBranch);
router.route("/editBranch").put(editBranch);
router.route("/getBranchesOption/cId/:cId").get(getBranchesOption);

export default router;
