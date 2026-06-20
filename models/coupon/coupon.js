const mongoose = require("mongoose")

const couponSchema = new mongoose.Schema({
    code : {
        type: String,
        required: true,
        unique: true
    },
    discountPercentage : {
        type:Number,
        required:true
    },
    expiryDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default:false
    }
}, {timestamps : true})

const couponModel = mongoose.model("Coupon", couponSchema)

module.exports = couponModel;