import express from "express";
import {
    getProducts,
    addProducts,
    getTransportStocks,
    confirmationByCompany,
    confirmationByStoreSender,
    receivedApproval,
    requestStockTransfer,
    getTransferProducts,
    reprocessRequest,
    getCategories,
    addCategory,
    editCategory,
    deleteCategory
} from "../controller/controllerProducts";
import protect from "../middleware/authMiddleware";

const router = express.Router();

router.route("/getProducts/cId/:cId/bId/:bId").get(protect, getProducts);
router.route("/addProduct").post(protect, addProducts);
router
    .route("/getTransportOrder/cId/:cId/bId/:bId")
    .get(protect, getTransportStocks);
router.route("/transportStock").post(requestStockTransfer)
router.route("/confirmByComp").put(protect, confirmationByCompany);
router.route("/confirmByBranch").put(protect, confirmationByStoreSender);
router.route("/confirmReceived").put(protect, receivedApproval);
router.route("/getListOfProductsConfirmation/tId/:tId").get(getTransferProducts)
router.route("/reprocessRequest").put(protect, reprocessRequest)

// Categories 
router.route("/getCategories").get(getCategories);
router.route("/addCategory").post(protect, addCategory);
router.route("/editCategory").patch(protect, editCategory);
router.route("/deleteCategory").delete(protect, deleteCategory)
export default router;
