const Razorpay = require("razorpay");
const crypto = require("crypto");
const couponModel = require("../../models/coupon/coupon");
const orderModel = require("../../models/order/Order");
const productModel = require("../../models/products/product");
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createPaymentOrder = async (req, res) => {
  try {
   const { orderId } = req.body;

if (!orderId) {
    return res.status(400).json({
        success: false,
        message: "Order ID is required"
    });
}

const order = await orderModel.findById(orderId);

if (!order) {
    return res.status(404).json({
        success: false,
        message: "Order not found"
    });
}

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid",
      });
    }

    const userId = req.user.id;
    if (order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const options = {
      amount: order.totalAmount * 100,
      currency: "INR",
      receipt: order._id.toString(),
      notes: {
        userId: userId,
        orderId: order._id.toString(),
      },
    };
    const razorpayOrder = await razorpay.orders.create(options);

    await orderModel.findByIdAndUpdate(
      orderId,
      {
        razorpayOrderId: razorpayOrder.id,
      },
      {
        new: true,
      },
    );
    return res.status(200).json({
      success: true,
      message: "successfully created",
      data: razorpayOrder,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Payment Order creation failed",
    });
  }
};

const verifiedPayment = async (req, res) => {
  try {
    const {
      orderId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !orderId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "All payment are required",
      });
    }
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "order not found",
      });
    }
    if (order.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Order already paid",
      });
    }

    const userId = req.user.id;
    if (order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay Order ID",
      });
    }
    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    for(const item of order.items) {
      const product = await productModel.findById(item.product)
      if(!product) {
        return res.status(404).json({
          success: false,
          message: "product not found"
        })
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
        success: false,
        message: `${product.name} has only ${product.stock} items left`
        });
      }
      product.stock -= item.quantity;
      await product.save();
    }

    if (order.coupon) {

    const updatedCoupon = await couponModel.findOneAndUpdate(
        { code: order.coupon },
        {
            $inc: {
                usedCount: 1
            }
        },
        {
            new: true
        }
    );

    if (!updatedCoupon) {
        return res.status(404).json({
            success: false,
            message: "Coupon not found"
        });
    }
}
    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: "Paid",
        paymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpaySignature: razorpay_signature,
        paidAt: new Date(),
        status: "Processing",
      },
      {
        new: true,
      },
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: updatedOrder,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Verified Payment Failed",
    });
  }
};

const paymentFailed = async(req,res)=> {
  try{
    const {orderId} = req.body
    if(!orderId) {
      return res.status(400).json({
        success:false,
        message: "OrderId is required"
      })
    }

    const order = await orderModel.findById(orderId)
    if(!order) {
      return res.status(404).json({
        success: false,
        message: "order not found"
      })
    }

    const userId = req.user.id;
    if(order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if(order.paymentStatus === "Paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid"
      })
    }

    const updatedOrder = await orderModel.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: "Failed",
        status: "Pending",
        failedAt: new Date()
      },
      {
        new: true
      }
    )

    if(!updatedOrder) {
      return res.status(404).json({
        success:false,
        message:"Order not found"
      })
    }

    return res.status(200).json({
      success:true,
      message:"Payment failed. You can retry the payment",
      data: updatedOrder
    })
  } catch(err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      message: "something went wrong payment Failed"
    })
  }
}
module.exports = {
  createPaymentOrder,
  verifiedPayment,
  paymentFailed
};
