const cartModel = require("../../models/carts/cart");
const Cart = require("../../models/carts/cart");
const productModel = require("../../models/products/product");
const userModel = require("../../models/user");

const addToCart = async (req,res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId)
        const productId = req.params.productId
        
        const product = await productModel.findById(productId)


        if(!user) {
            return res.status(404).json({
                success: false,
                message: "user not found"
            })
        }

        if(!product) {
            return res.status(404).json({
                success: false,
                message: "product not found"
            })
        }

        const cartItem = await Cart.findOne( {
            user: userId,
            product: productId 
        })

        if(cartItem) {
            cartItem.quantity += 1
            await cartItem.save()

            return res.status(200).json({
                success : true,
                message : "Cart Quantity increased",
                data: cartItem
            })
        }

        const newCartItem =  await Cart.create({
            user: userId,
            product:productId,
            quantity: 1
        });
        

        return res.status(201).json({
            success: true,
            message: "successfully created cart Item",
            data: newCartItem
        })
    }catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: " something went wrong in cart"
        })
    }

    
}

const getCart = async(req,res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId)
        if(!user) {
            return res.status(404).json({
                success: false,
                message: "user not found"
            })
        }

        const cartItems = await Cart.find({
            user : userId
        })
        .populate("product")
        .populate("user", "name email");

        return res.status(200).json({
            success: true,
            message : "successfully get product from cart",
            data : cartItems
        })
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success : false,
            message : "something went wrong while cart getting items"
        })
    }
     
}

const deleteCart = async(req,res) => {
    try{
        const cartId = req.params.cartId
        const cart = await cartModel.findByIdAndDelete(cartId)
        .populate("product")
        .populate("user", "name email")
        if(!cart) {
            return res.status(404).json({
                success: false,
                message: "CartId not found"
            })
        }
        return res.status(200).json({
            success: true,
            message: "Cart successfully deleted",
            data : cart
        })
    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success: false,
            message: "something went wrong while deleting cart"
        })
    }
}

const updateCart = async(req,res) => {
    try {
        const cartId = req.params.cartId;
        const {quantity} = req.body

        if(quantity < 1) {
            return res.status(400).json({
                success: true,
                message: "Quantity must be atleast 1"
            })
        }
        const cart = await cartModel.findByIdAndUpdate(cartId,
            {quantity},
            {new:true}
        )
        .populate("product")
        .populate("user", "name email")
        if(!cart) {
            return res.status(404).json({
                success: false,
                message: "CartId not found"
            })
        }
        return res.status(200).json({
            success: true,
            message: "Cart successfully updated",
            data : cart
        })
    } catch(err) {
        console.log(err)
         return res.status(500).json({
            success: false,
            message: "something went wrong while updating cart"
        })
    }
}
module.exports = {
    addToCart,
    getCart,
    deleteCart,
    updateCart
}