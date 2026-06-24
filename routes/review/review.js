const express = require('express');
const { addReview, deleteReview, AverageRating, getReviews } = require('../../controller/review/reviewController');
const authMiddleware = require("../../middleware/authMiddleware")
const router = express.Router();

router.post("/add-review/:productId",authMiddleware,addReview)
router.get("/product-rating/:productId",getReviews)
router.delete("/delete-rating/:productId",authMiddleware, deleteReview)
router.get("/get-Product-rating/:productId",AverageRating)

module.exports = router;