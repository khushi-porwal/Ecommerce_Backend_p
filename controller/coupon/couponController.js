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
            code:code.toUpperCase()
        })

        if(existingCoupon) {
            return res.status(400).json({
                success:false,
                message:"coupon already exists"
            })
        }

        if(new Date(expiryDate) <= new Date()) {
            return res.status(400).json({
                success:false,
                message: "Expiry date must be in future"
            })
        }

        const coupon = await couponModel.create({
            code: code.toUpperCase(),
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

const applyCoupon = async (req, res) => {
    try {

        const { code, amount } = req.body;

        // =========================
        // Validation
        // =========================

        if (!code) {
            return res.status(400).json({
                success: false,
                message: "Coupon code is required"
            });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid order amount"
            });
        }

        // =========================
        // Find Coupon
        // =========================

        const coupon = await couponModel.findOne({
            code: code.trim().toUpperCase()
        });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: "Invalid coupon code"
            });
        }

        // =========================
        // Active Check
        // =========================

        if (!coupon.isActive) {
            return res.status(400).json({
                success: false,
                message: "Coupon is inactive"
            });
        }

        // =========================
        // Expiry Check
        // =========================

        if (new Date() > coupon.expiryDate) {
            return res.status(400).json({
                success: false,
                message: "Coupon has expired"
            });
        }

        // =========================
        // Usage Limit Check
        // =========================

        if (coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({
                success: false,
                message: "Coupon usage limit exceeded"
            });
        }

        // =========================
        // Minimum Order Amount
        // =========================

        if (amount < coupon.minimumAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum order amount should be ₹${coupon.minimumAmount}`
            });
        }

        // =========================
        // Discount Calculation
        // =========================

        let discountAmount =
            (amount * coupon.discountPercentage) / 100;

        discountAmount = Math.min(
            discountAmount,
            coupon.maxDiscount
        );

        const finalAmount = amount - discountAmount;

        // =========================
        // Response
        // =========================

        return res.status(200).json({
            success: true,
            message: "Coupon applied successfully",
            data: {
                couponCode: coupon.code,
                originalAmount: amount,
                discountAmount,
                finalAmount,
                discountPercentage: coupon.discountPercentage
            }
        });

    } catch (err) {

        console.log(err);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while applying coupon"
        });

    }
};
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
            return res.status(404).json({
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
            data:updatedCoupon
        })


    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success:false,
            message:"something went wrong while getting update in coupon"
        })
    }
}