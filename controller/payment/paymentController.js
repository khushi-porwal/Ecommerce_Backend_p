const Razorpay = require("razorpay")
const crypto = require("crypto")
const orderModel = require("../../models/order/Order");
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

const createPaymentOrder = async(req,res) => {
    try{
        const {amount} = req.body;

        const options = {
            amount : amount * 100,
            currency : "INR"

        }
        const order = await razorpay.orders.create(options);
        return res.status(200).json({
            success:true,
            message:"successfully created",
            data : order
        })
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "Payment Order creation failed"
        })
    }
}

const verifiedPayment = async(req,res) => {
    try {
    const {
    orderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
    } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        

        const expectedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;


        if(!isAuthentic) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed"
            });
        }

        const updatedOrder = await orderModel.findByIdAndUpdate(
            orderId,
            {
                paymentStatus: "Paid",
                paymentId : razorpay_payment_id
            },
            {
                new : true
            }
        );

        if(!updatedOrder) {
            return res.status(404).json({
                success:false,
                message: "Order not found"
            })
        }
        return res.status(200).json({
            success: true,
            message : "Payment verified successfully",
            data : updatedOrder
        })
        
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Verified Payment Failed"
        })
    }
}
module.exports = {
    createPaymentOrder,
    verifiedPayment
}