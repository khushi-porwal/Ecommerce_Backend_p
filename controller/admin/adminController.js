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
            return res.status(404).json({
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

        const statusFlow = {
            Pending: ["Processing", "Cancelled"],
            Processing: ["Shipped", "Cancelled"],
            Shipped: ["Delivered"],
            Delivered: [],
            Cancelled: []
        };

        if (!statusFlow[order.status]) {
            return res.status(400).json({
                success: false,
                message: "Invalid current order status"
            });
        }
        if(!statusFlow[order.status].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status"
            })
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
            message: "Order successfully updated",
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

const getTopSellingProducts = async(req,res) => {
    try{
        const product = await orderModel.aggregate([
            {
                $match: {
                    paymentStatus: "Paid",
                    status: {
                        $ne: "Cancelled" //not equal to
                    }
                }
            },
            {
                $unwind: "$items"// unwind aggregate isliye use hoota hain thaaki array ko thodh saako aur alg alg data le skko 
            },
            {
                $group: {
                    _id: "$items.product",
                    totalSold: {
                        $sum: "$items.quantity"
                    }
                }
            },
            {
                $sort: {
                    totalSold: -1
                }
            },
            {
                $limit: 5
            },
            {
                //look up is used for product ka name bhi chahiye.Uske liye aggregation mein lookup
                $lookup : {
                    from: "products", //from      -> kis collection se
                    localField: "_id", //localField -> current document ki field
                    foreignField: "_id", //foreignField -> dusri collection ki field
                    as: "productInfo" //as -> result kis naam se store hoga
                }

            },
            {
                $unwind: "$productInfo"
            },
            {
                $project: {
                   _id: 0, // id ko hide kerne ke liye
                    name: "$productInfo.name",
                    image: "$productInfo.image",
                    totalSold: 1 // totalSold already current document mein hai.
                }
            }
            
        ])


        if(product.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No sales data found"
            })
        }

        return res.status(200).json({
            success:true,
            message: "Top selling product fetched successfully",
            data: product
        })
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success:false,
            message:"something went wrong while to getting product"
        })
    }
}

const getMonthlyRevenue = async(req,res) => {
    try {
        const monthlyRevenue = await orderModel.aggregate([
            {
                $match: {
                    paymentStatus: "Paid"
                }
            },
            {
                $group: { //group ke andr hamesha group _id hoothi hain 
                    _id: {
                        month: {
                            $month: "$createdAt"
                        },
                    },
                    revenue: {
                         $sum : "$totalAmount"
                    }
                    
                }
            },
            {
                $sort:{ //month khaa hain_id ke ander
                    "_id.month" : 1
                }
            },
            {
                $project: {
                    _id: 0,
                    month : "$_id.month",
                    revenue: 1
                }
            }
        ])

        if(monthlyRevenue.length == 0) {
            return res.status(404).json({
                success: false,
                message: "revenue does not exist"
            })
        }

        return res.status(200).json({
            success: true,
            message: "successfully revenue fetched",
            data : monthlyRevenue
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"something went wrong while getting monthly revenue"
        })
    }
}

const getTopCategory = async(req,res) => {
    try {
        const category = await orderModel.aggregate([
            {
                $match : {
                    paymentStatus :"Paid"
                }
            },
            {
                $unwind : "$items"
            },
            {
                $lookup: {
                    from: "products",
                    localField: "items.product",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            {
                $unwind: "$productInfo"
            },
            {
                $group: {
                    _id: "$productInfo.category",
                    totalSold: {
                        $sum: "$items.quantity"
                    }
                }
            },
            {
                $sort: {
                    totalSold: -1
                }
            },
            {
                $limit: 5
            },
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    totalSold: 1
                }
            }
        ])
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success:false,
            message:"something went wrong while getting top category"
        })
    }
}

const getLowStockProducts = async(req,res) => {
    try{
        const product = await productModel.find({
            stock: {
                $lte: 5
            }
        }).select("name stock category image")
        .sort({stock: 1}) //Ascending order

        if(product.length == 0) {
            return res.status(400).json({
                success: false,
                message: "product do not exist"
            })
        }
        return res.status(200).json({
            success: true,
            messgae: "successfully get low stock product",
            data: product
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "Something went wrong while getting low stock products"
        })
    }
}
const getRecentOrder = async(req,res) => {
    try{
        const orders = await orderModel.find()
            .populate("user", "name email")
            .populate("items.product")
            .sort({
                createdAt: -1 //newest to oldest
        }).limit(5);

        if(orders.length === 0) {
            return res.status(404).json({
                success:false,
                message: "order donot found"
            })
        }
        return res.status(200).json({
            success: true,
            message: "successfully get an recent orders",
            data: orders
        })
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            messgage: "Something went wrong while getting recent orders"
        })
    }
}

const getOrderByStatus = async(req,res)=> {
    try {
        const orders = await orderModel.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: {
                        $sum: 1   //$sum: 1 ka matlab MongoDB har document ke liye 1 add karega.
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    status: "$_id",
                    count: 1
                }
            }
        ])

    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "Something went wrong while getting order status"
        })
    }
}

const getBestCustomer = async(req,res) => {
    try{
        const customers = await orderModel.aggregate([
            {
                $match: {
                paymentStatus: "Paid"
                }
            },
            {
                $group: {
                    _id: "$user",

                    totalSpent: {
                        $sum: "$totalAmount"
                    },
                    
                }
            },
            {
                $sort: {
                    totalSpent: -1
                }
            },
            {
                $limit: 5
            },
            {
                $lookup: { // lookup use hoota hain jab ek collection aka data doosre collection ko use kernaa hoota hain 
                    from: "users", // from hamesha mongodb se aataa hain 
                    localField: "_id", // user ki value store kerne ke liye
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            {
                $unwind: "$userInfo" // array ko object mein convert ker rha hain kyuki humhe sir userInfo chhiye 
            },
            {
                $project: {
                    _id: 0,
                    name: "$userInfo.name",
                    email: "$userInfo.email",
                    totalSpent: 1
                }
            },
            
        ])

        if(customers.length === 0) {
            return res.status(404).json({
                success:false,
                message:"customers not found"
            })
        }

        return res.status(200).json({
            success: true,
            message: "successfully get customers",
            data:customers
        })
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "something went wrong get Best customer"
        })
    }
}
module.exports = {
    getAllOrder,
    updateOrderStatus,
    getAllUser,
    getDashboardStats,
    getTopSellingProducts,
    getMonthlyRevenue,
    getTopCategory,
    getLowStockProducts,
    getRecentOrder,
    getOrderByStatus,
    getBestCustomer
}

















// $unwind  → Array todna
// $group   → Data aggregate karna
// $sum     → Quantity add karna
// $sort    → Ranking banana
// $lookup  → Join collections
// $project → Output customize karna
// $limit   → Top N records

// Difference
// $lt → Less Than (<)
// $lte → Less Than or Equal (<=)
// $gt → Greater Than (>)
// $gte → Greater Than or Equal (>=)