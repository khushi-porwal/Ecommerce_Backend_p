const express = require("express")
const router = express.Router();
const authMiddleware = require("../../middleware/authMiddleware")
const adminMiddleware = require("../../middleware/adminMiddleware")
const {getAllOrder, updateOrderStatus, getAllUser, getDashboardStats} = require("../../controller/admin/adminController")

router.get("/get-all-order",authMiddleware ,adminMiddleware, getAllOrder)
router.put("/update-admin-order/:id/status",authMiddleware, adminMiddleware, updateOrderStatus)
router.get("/get-all-users", authMiddleware, adminMiddleware, getAllUser)
router.get("/dashboard-stats", authMiddleware, adminMiddleware, getDashboardStats)
module.exports = router