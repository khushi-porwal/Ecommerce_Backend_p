const cartModel = require("../../models/carts/cart");
const orderModel = require("../../models/order/Order");
const userModel = require("../../models/user");
const AddressModel = require("../../models/address/Address");
const couponModel = require("../../models/coupon/coupon");

const placeOrder = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Request Body
    const { address: addressId, couponCode } = req.body;

    // Address Validation
    const address = await AddressModel.findById(addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    if (address.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to use this address",
      });
    }

    // Cart
    const cartItems = await cartModel
      .find({ user: userId })
      .populate("product");

    if (cartItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Cart is empty",
      });
    }

    let totalAmount = 0;

    for (const item of cartItems) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: "Product not found",
        });
      }

      if (item.quantity > item.product.stock) {
        return res.status(400).json({
          success: false,
          message: `${item.product.name} has only ${item.product.stock} items left in stock`,
        });
      }

      totalAmount += item.product.price * item.quantity;

      // Reduce Stock
      // item.product.stock -= item.quantity;
      // await item.product.save();
    }

    // ==========================
    // Coupon Validation
    // ==========================

    let coupon = null;

    if (couponCode) {
      coupon = await couponModel.findOne({
        code: couponCode.trim().toUpperCase(),
      });

      if (!coupon) {
        return res.status(404).json({
          success: false,
          message: "Invalid coupon code",
        });
      }

      if (!coupon.isActive) {
        return res.status(400).json({
          success: false,
          message: "Coupon is inactive",
        });
      }

      if (new Date() > coupon.expiryDate) {
        return res.status(400).json({
          success: false,
          message: "Coupon has expired",
        });
      }

      if (coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({
          success: false,
          message: "Coupon usage limit exceeded",
        });
      }

      if (totalAmount < coupon.minimumAmount) {
        return res.status(400).json({
          success: false,
          message: `Minimum order amount should be ₹${coupon.minimumAmount}`,
        });
      }

      let discountAmount =
        (totalAmount * coupon.discountPercentage) / 100;

      discountAmount = Math.min(
        discountAmount,
        coupon.maxDiscount
      );

      totalAmount -= discountAmount;
    }

    // ==========================
    // Create Order
    // ==========================

    const order = await orderModel.create({
      user: userId,

      items: cartItems.map((item) => ({
        product: item.product._id,
        quantity: item.quantity,
      })),

      totalAmount,

      coupon: coupon ? coupon.code : null,

      paymentStatus: "Pending",

      address: addressId,
    });

    // Clear Cart
    await cartModel.deleteMany({
      user: userId,
    });

    return res.status(201).json({
      success: true,
      message: "Successfully placed order",
      data: order,
    });

  } catch (err) {
    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while placing order",
    });
  }
};


const getMyOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await orderModel
      .find({
        user: userId,
      })
      .populate("items.product")
      .populate("address");
    if (orders.length == 0) {
      return res.status(404).json({
        success: false,
        message: "order not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "successfully fetched product",
      data: orders,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "something went wrong during get my product",
    });
  }
};

const getSingleOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await orderModel
      .findById(orderId)
      .populate("user", "name email")
      .populate("items.product");
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "order not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "successfully fetched single product",
      data: order,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "something went wrong during get my single product",
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await orderModel
      .findById(orderId)
      .populate("user", "name email")
      .populate("items.product");
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "order not found",
      });
    }

    const { status } = req.body;
    const allowedStatus = [
      "Pending",
      "Processing",
      "Shipped",
      "Delivered",
      "Cancelled",
    ];
    if (!allowedStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const updateStatus = await orderModel.findByIdAndUpdate(
      orderId,
      {
        status,
      },
      {
        new: true,
      },
    );
    return res.status(200).json({
      success: true,
      message: "order updated successfully",
      data: updateStatus,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "something went wrong during updated order",
    });
  }
};

const cancelOrder = async(req,res) => {
  try{
    const orderId = req.params.orderId
    if(!orderId) {
      return res.status(400).json({
        success:false,
        message:"orderId not found"
      })
    }
    const order = await orderModel.findById(orderId);

    if (!order) {
        return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    const userId = req.user.id
    if(order.user.toString() != userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }
    if (order.status === "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Delivered orders cannot be cancelled"
      });
    }

    if (order.status === "Cancelled") {
      return res.status(400).json({
        success:false,
        message: 'order already cancelled'
      })
    }
  } catch(err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      message: "Something went wrong while cancelling order"
    })
  }
}
module.exports = {
  placeOrder,
  getMyOrder,
  getSingleOrder,
  updateOrderStatus,
};
