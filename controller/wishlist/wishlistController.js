const Wishlist = require("../../models/wishlist/wishlist");
const userModel = require("../../models/user")
const productModel = require("../../models/products/product")

const addToWishlist = async (req,res) => {

try {
       const userId = req.user.id
   const productId = req.params.productId;

   const user = await userModel.findById(userId);
   if(!user) {
    return res.status(404).json({
        success: false,
        message: "user not found"
    })
   }

   const product = await productModel.findById(productId) 
   
   if(!product) {
    return res.status(404).json({
        success: false,
        messgae: "product not found"
    })
   }

   const existingWishlist = await Wishlist.findOne({
    user:userId,
    product: productId
   })
   if(existingWishlist) {
    return res.status(400).json({
        success: false,
        message:"product already in wishlist"
    })
   }

   const wishlistItem = await Wishlist.create({
    user:userId,
    product :productId
   })

   return res.status(201).json({
    success: true,
    message: "successfully created wishlist",
    data : wishlistItem
   })
}catch(err) {
    console.log(err);
    return res.status(500).json({
        success: false,
        message: "something went wrong"
    })
}
}


const getWishlist = async(req,res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId)

        if(!user) {
            return res.status(400).json({
                success:false,
                message:"user not found"
            })
        }

        const wishlist = await Wishlist.find({
            user:userId,
           
        }).populate("product")

        if(Wishlist.length == 0) {
            return res.status(400).json({
                success:false,
                message:"no items exists in wishlist"
            })
        }
        return res.status(200).json({
            success:true,
            message:"successfully get items",
            data:wishlist
        })
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success:false,
            message : "something went wrong in wishlist"
        })
    }
}


const deleteWishlist = async (req,res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId)
        if(!user) {
            return res.status(400).json({
                success:false,
                message:"user not found"
            })
        }

        const productId = req.params.productId;
        const wishlistItem = await Wishlist.findOneAndDelete({
            user:userId,
            product:productId
        })
        if(!wishlistItem) {
            return res.status(400).json({
                success: false,
                message: "item do not found"
            })
        }

        return res.status(200).json({
            success:true,
            messgae:"deleted suceessfully wishlistItem",
            data: wishlistItem
        })

    } catch(err) {
        console.log(err);
        return res.status(500).json({
            success:false,
            message:"something went wrong while deleting"
        })
        
    }
}

module.exports = {
    addToWishlist,getWishlist,deleteWishlist
}