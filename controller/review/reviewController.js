const userModel = require("../../models/user")
const mongoose = require("mongoose");
const productModel = require("../../models/products/product")
const Review = require("../../models/review/review")
const orderModel = require("../../models/order/Order")
const updateProductRating = require("../../utils/updatePProductRating")

const addReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const productId = req.params.productId;

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const { rating, comment } = req.body;

        if (rating === undefined || !comment) {
            return res.status(400).json({
                success: false,
                message: "Rating and comment are required"
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5"
            });
        }

        if (!comment.trim()) {
            return res.status(400).json({
                success: false,
                message: "Comment cannot be empty"
            });
        }

        // User must have purchased and received the product
        const purchasedOrder = await orderModel.findOne({
            user: userId,
            paymentStatus: "Paid",
            status: "Delivered",
            "items.product": productId
        });

        if (!purchasedOrder) {
            return res.status(403).json({
                success: false,
                message: "You can review only purchased and delivered products"
            });
        }

        // One review per product per user
        const existingReview = await Review.findOne({
            user: userId,
            product: productId
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "You already reviewed this product"
            });
        }

        // Create Review
        const review = await Review.create({
            user: userId,
            product: productId,
            rating,
            comment
        });

        // ===============================
        // Update Product Average Rating
        // ===============================

        await updateProductRating(productId);

        return res.status(201).json({
            success: true,
            message: "Review added successfully",
            data: review
        });

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while adding review"
        });
    }
};
const getReviews = async(req,res) => {
try {
    const productId = req.params.productId;
    const product = await productModel.findById(productId)

    if(!product) {
        return res.status(400).json({
            success:false,
            message:"product do not found"
        })
    }

    const review = await Review.find({
        product:productId
    }).populate("user","name")

    if(review.length === 0) {
        return res.status(400).json({
            success:false,
            message:"review do not get"
        })
    }
    let averageRating = 0;
    for(const item of review) {
        averageRating += item.rating;
    }
    averageRating = averageRating/review.length;

    return res.status(200).json({
        success : true,
        message: "successfully get reviews",
        averageRating,
        data: review
    })
} catch(err) {
    console.log(err);
    return res.status(500).json({
        success: false,
        message:"something went wrong in getting review"
    })
}
}
const deleteReview = async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const userId = req.user.id;

        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        if (review.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can delete only your own review"
            });
        }

        // Store productId before deleting review
        const productId = review.product;

        // Delete Review
        const deletedReview = await Review.findByIdAndDelete(reviewId);

        // =============================
        // Recalculate Product Rating
        // =============================

        await updateProductRating(productId);

        return res.status(200).json({
            success: true,
            message: "Review deleted successfully",
            data: deletedReview
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while deleting review"
        });

    }
};

const AverageRating = async(req,res) => {
    try {
        const productId = req.params.productId;
        const product = await productModel.findById(productId);

        if(!product) {
            return res.status(404).json({
                success:false,
                message:"product do not found"
            })
        }
       

        const review = await Review.find({
            product:productId
        })

        if(review.length === 0) {
            return res.status(200).json({
                success: true,
                averageRating: 0,
                totalReviews: 0
            });
        }

        let totalRating = 0;

        for(let item of review) {
            totalRating += item.rating;
        }

        const averageRating = totalRating/review.length;
        
        return res.status(200).json({
            success: true,
            averageRating,
            totalReviews: review.length
        });

    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success:false,
            message: "something went wrong average rating"
        })
    }
}


const updateReview = async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const userId = req.user.id;

        // Find Review
        const review = await Review.findById(reviewId);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        // Check Ownership
        if (review.user.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: "You can update only your own review"
            });
        }

        const { rating, comment } = req.body;

        // Validation
        if (rating === undefined || !comment) {
            return res.status(400).json({
                success: false,
                message: "Rating and comment are required"
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5"
            });
        }

        if (!comment.trim()) {
            return res.status(400).json({
                success: false,
                message: "Comment cannot be empty"
            });
        }

        // Update Review
        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            {
                rating,
                comment
            },
            {
                new: true
            }
        );

        // ============================
        // Update Product Rating
        // ============================
        await updateProductRating(review.product);

        return res.status(200).json({
            success: true,
            message: "Review updated successfully",
            data: updatedReview
        });

    } catch (err) {
        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while updating review"
        });
    }
};
module.exports= {
    addReview,getReviews,deleteReview,AverageRating
}