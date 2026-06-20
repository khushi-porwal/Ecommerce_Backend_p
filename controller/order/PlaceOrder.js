const cartModel = require("../../models/carts/cart");
const orderModel = require("../../models/order/Order");
const userModel = require("../../models/user");

const placeOrder = async (req,res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId)
        if(!user) {
            return res.status(404).json({
            success: false,
            message: "user not found"
            })
        }
        
        const cartItems = await cartModel.find({
            
            user : userId
        })
        .populate("product")


        if(cartItems.length === 0) {
            return res.status(404).json({
             success: false,
              message: "Cart is empty"
            });
        }

        let totalAmount = 0;
        for(const item of cartItems) {
            if(!item.product) {
                return res.status(400).json({
                    success: false,
                    message: "product not found"
                })
            }
            if(item.quantity > item.product.stock) {
               return res.status(400).json({
                    success: false,
                    message:`${item.product.name} has only ${item.product.stock} items left in stock`
                })
            }

            
            totalAmount += item.product.price * item.quantity
            item.product.stock -= item.quantity
            await item.product.save();
        }

        const order = await orderModel.create({
            user: userId ,

            items : cartItems.map(item => ({
                product : item.product._id,
                quantity: item.quantity
            })),

            totalAmount,
            paymentStatus: "Pending"
        })

        await cartModel.deleteMany({
            user: userId
        });
        return res.status(201).json({
            success: true,
            message : "Successfully placed order",
            data: order
        })
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "Something went wrong in this place order"
        })
    }
    
}

const getMyOrder = async (req,res) => {
    try{
        const userId = req.user.id
        const orders = await orderModel.find({
            user: userId
        })
        .populate("items.product")
        if(orders.length == 0) {
            return res.status(404).json({
                success: false,
                message: "order not found"
            })
        }
        return res.status(200).json({
                success: true,
                message: "successfully fetched product",
                data: orders
            }) 
    }catch(err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message : "something went wrong during get my product"
        })
    }
}

const getSingleOrder = async(req,res) => {
    try {
        const orderId = req.params.id;
    const order = await orderModel.findById(
        orderId
    ).populate("user", "name email")
    .populate("items.product")
    if(!order) {
        return res.status(404).json({
            success: false,
            message: "order not found"
        })
    }
    return res.status(200).json({
                success: true,
                message: "successfully fetched single product",
                data: order
    })

    }catch(err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message : "something went wrong during get my single product"
        })
    }
    
}

const updateOrderStatus = async(req, res) => {
    try {
        const orderId = req.params.id
    const order = await orderModel.findById(
        orderId
    ).populate("user", "name email")
    .populate("items.product")
    if(!order) {
        return res.status(404).json({
            success: false,
            message: "order not found"
        })
    }

    const {status} = req.body
    const allowedStatus = [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled"
    ]
    if(!allowedStatus.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid status"
        })
    }
    
    const updateStatus = await orderModel.findByIdAndUpdate(
        orderId,
        {
            status
        },
        {
            new : true
        }
    )
    return res.status(200).json({
        success: true,
        message: "order updated successfully",
        data: updateStatus
    })
    }catch(err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message : "something went wrong during updated order"
        })
    }
    
}
module.exports = {
    placeOrder,
    getMyOrder,
    getSingleOrder,
    updateOrderStatus
}