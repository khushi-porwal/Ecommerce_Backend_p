const mongoose = require('mongoose')
const User = require("../../models/user")
const Product = require("../../models/products/product")
const orderSchema = new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required: true
    },
    items : [
        {
            product :  {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Product",
            required: true
            },
            quantity : {
                type: Number,
                min: 1,
                required: true
            }
        }
      
    ],

    totalAmount : {
        type: Number,
        required: true
    },
    status : {
        type: String,
        enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
        required: true,
        default: "Pending"
    },
    paymentStatus : {
        type :String,
        enum:["Pending", "paid"],
        default : "Pending"
    },
    paymentId : {
        type: String
    }
}, {
    timestamps : true
});

const orderModel = mongoose.model("Order", orderSchema)
module.exports = orderModel;