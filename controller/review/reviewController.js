const userModel = require("../../models/user")
const productModel = require("../../models/products/product")
const Review = require("../../models/review/review")

const addReview = async(req,res) => {
try{
    const userId = req.user.id;
    const productId = req.params.productId

    const user = await userModel.findById(userId);
    if(!user) {
        return res.status(400).json({
            success: false,
            message:"user not found"
        })
    }
    const product = await productModel.findById(productId)
    if(!product) {
        return res.status(400).json({
            success:false,
            message:"product do not found"
        })
    }
    const {rating,comment} = req.body;

    if(rating === undefined || !comment) {
    return res.status(400).json({
        success: false,
        message: "Rating and comment are required"
    });
}
    const existingReview = await Review.findOne({
        user:userId,
        product:productId
    })

    if(existingReview) {
        return res.status(400).json({
            success: false,
            message: "You already reviewed this product"
        })
    }

    const review = await Review.create({
        user:userId,
        product:productId,
        rating,
        comment
    })
    return res.status(201).json({
        success:true,
        message:"successfully rating and comment",
        data:review
    })
} catch(err) {
    console.log(err);
    return res.status(500).json({
        success:false,
        message:"something went wrong in review"
    })
}
}

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

const deleteReview = async(req,res) => {
    try {
        const reviewId = req.params.reviewId;
        const review = await Review.findById(reviewId);

        const userId = req.user.id; 

        if(!review) {
            return res.status(400).json({
                success:false,
                message:"review do not found"
            })
        }

        if(review.user.toString() != userId) {
            return res.status(403).json({
                success: false,
                message: "you can delete only your own review"
            })
        }
        const deleteReview = await Review.findByIdAndDelete(reviewId)

        return res.status(200).json({
            success: true,
            message : "successfully deleted review",
            data: deleteReview
        })

    } catch(err) {
        console.log(err);
        return res.status(500).json({
            successs: false,
            messsage:"something went wrong while deleting"
        })
    }

}

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

module.exports= {
    addReview,getReviews,deleteReview,AverageRating
}