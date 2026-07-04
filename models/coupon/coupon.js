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
    },
    minimumAmount: {
        type:Number,
        default: 0
    },
    maxDiscount: {
        type: Number,
        default: 500
    },
    usageLimit:{
    type:Number
    },
    usedCount:{
    type:Number,
    default:0
    }
}, {timestamps : true})

const couponModel = mongoose.model("Coupon", couponSchema)

module.exports = couponModel;