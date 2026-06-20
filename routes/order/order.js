const express = require("express")
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware")
const {placeOrder, getMyOrder, getSingleOrder, updateOrderStatus} = require("../../controller/order/PlaceOrder")

router.post("/create-order", authMiddleware, placeOrder)
router.get("/get-my-order", authMiddleware, getMyOrder)
router.get("/get-single-order/:orderId",getSingleOrder)
router.put("/update-order/:orderId/status", updateOrderStatus)
module.exports = router