const orderModel = require("../../models/order/Order")
const productModel = require("../../models/products/product")
const userModel = require("../../models/user")

const getAllOrder = async (req,res) => {
    try{
         const orders = await orderModel.find()
         .populate("user", "name email")
         .populate("items.product")
         if(orders.length === 0) {
            return res.status(404).json({
                success : false,
                message: "orders not found"
            })
         }
         return res.status(200).json({
            success: true,
            message: "All orders fetched successfullly",
            data : orders
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message:"something went while getting product on admin"
        })
    }

} 

const updateOrderStatus = async(req,res) => {
    try {
        const orderId = req.params.id;
        const order = await orderModel.findById(orderId)
        .populate("items.product")

        if(!order) {
            return res.status(400).json({
                success: false,
                message: "order not found"
            })
        }
        const {status} = req.body;

        const allowedStatus = [
            "Pending",
            "Processing",
            "Shipped",
            "Delivered",
            "Cancelled"
        ];

        if(!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Status"
            })
        }

        if(order.status !== "Cancelled" && status === "Cancelled") {

            for(const item of order.items) {

             item.product.stock += item.quantity;

             await item.product.save();
            }

        }

        const updateOrder = await orderModel.findByIdAndUpdate(
            orderId,
            {
                status
            },
            {
                new : true
            }
        )

        if(!updateOrder) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            })
        }
        
        return res.status(200).json({
            success: true,
            messgae: "Order successfully updated",
            data: updateOrder
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message:"something went while updating order on admin"
        })
    }
}

const getAllUser = async(req,res) => {
    try {
        const users = await userModel.find()
        .select("-password");
        if(users.length == 0) {
            return res.status(404).json({
                success: false,
                message : "users not found"
            })
        }

        return res.status(200).json({
            success: true,
            messgae: "user suceesfully found",
            data: users
        })

    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message : "Something went wrong while getting users"
        })
    }
}

const getDashboardStats = async(req,res) => {
    try {
        const totalUsers = await userModel.countDocuments();
        const totalProducts = await productModel.countDocuments();
        const totalOrders = await orderModel.countDocuments();

        const revenueResult = await orderModel.aggregate([
        {
            $match: {
                paymentStatus: "Paid"
            }
        },
       {

            $group: {
                _id: null,
                totalRevenue: {
                $sum: "$totalAmount"
                }
            }
        }
        ]);

        const totalRevenue = revenueResult.length > 0? revenueResult[0].totalRevenue : 0;
        return res.status(200).json({
            success: true,
            messgae: "suceesfully get Dashboard",
            data: {
                totalUsers,
                totalProducts,
                totalOrders,
                totalRevenue
            }
        });
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "Something went wrong while getting Dashboard Stats"
        })
    }
}
module.exports = {
    getAllOrder,
    updateOrderStatus,
    getAllUser,
    getDashboardStats
}