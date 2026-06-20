const couponModel = require("../../models/coupon/coupon")

const createCoupon = async(req,res) => {
    try {
        const {code,discountPercentage,expiryDate} = req.body;
        if(!code || !discountPercentage || !expiryDate) {
            return res.status(400).json({
                success:false,
                message:"All required feilds"
            })
        }

        const existingCoupon = await couponModel.findOne({
            code
        })

        if(existingCoupon) {
            return res.status(400).json({
                success:false,
                message:"coupon already exists"
            })
        }

        const coupon = await couponModel.create({
            code,
            discountPercentage,
            expiryDate
        })

        return res.status(201).json({
            success:true,
            message:"coupon created successfully",
            data:coupon
        })
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            message: "something went wrong in create coupon"
        })
    }
}

const applyCoupon = async(req,res) => {
    try {
        const {code,amount} = req.body;
        const coupon = await couponModel.findOne({
            code : code
        })
        if(!coupon) {
            return res.status(400).json({
                success: false,
                messgae: "entered coupon do not matched"
            })
        }
        if(amount<=0) {
            return res.status(400).json({
                success: false,
                messgae: "Invalid Amount"
            })
        }
        if(!coupon.isActive) {
             return res.status(400).json({
                success: false,
                messgae: "coupon is not active"
            })
        }

        if(new Date() > coupon.expiryDate) {
             return res.status(400).json({
                success: false,
                message: "coupon get expired"
            })
        }

        const discountAmount = (amount * coupon.discountPercentage)/100
        const finalAmount = amount - discountAmount;

        return res.status(200).json({
            success:true,
            message:"successfully applied coupon",
            originalAmount:amount,
            discountAmount,
            finalAmount,
            couponCode:coupon.code
        })

    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success:false,
            message:"something went wrong while applying coupon"
        })
    }
}

const getAllCoupon = async(req,res) => {
    try {
        const coupon = await couponModel.find()
        if(coupon.length == 0) {
            return res.status(400).json({
                success:false,
                message:"coupon not found"
            })
        }
        return res.status(200).json({
            success: true,
            message:"coupon successfully found",
            data:coupon
        })
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success:false,
            message:"something went wrong while getting coupon"
        })
    }
}

const deleteCoupon = async(req,res) => {
    try{
        const couponId = req.params.couponId;
        const coupon = await couponModel.findByIdAndDelete(couponId)
        if(!coupon) {
            return res.status(400).json({
                success:false,
                message:"coupon not found"
            })
        }

        return res.status(200).json({
            success:true,
            message:"delete coupon successfully",
            data:coupon
        })
         
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success:false,
            message:"something went wrong while getting coupon"
        })
    }
}

const couponUpdate = async(req,res) => {
    try{
        const couponId = req.params.couponId;
        const coupon = await couponModel.findById(couponId)

        if(!coupon) {
            return res.status(400).json({
                success:false,
                message:"coupon not found"
            })
        }
        

        const updatedCoupon = await couponModel.findByIdAndUpdate(
            couponId,
            {
                isActive: !coupon.isActive
            },
            {
                new: true
            }
        );

        return res.status(200).json({
            success:true,
            message:"delete coupon successfully",
            data:coupon
        })


    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success:false,
            message:"something went wrong while getting update in coupon"
        })
    }
}