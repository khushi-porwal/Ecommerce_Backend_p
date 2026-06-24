const AddressModel = require("../../models/address/Address")
const userModel = require("../../models/user")

const addAddress = async(req,res) => {
    try{
        const userId = req.user.id;
        const user = await userModel.findById(userId);
        if(!user) {
            return res.status(400).json({
                success:false,
                message:"user not found"
            })
        }
        const {street,city,pincode,state,country,fullName,phone} = req.body;
        if(!street || !city || !pincode || !state || !country,!phone|| !fullName) 
        {
            return res.status(400).json({
                success:false,
                message:"no feild is empty in their"
            })
        }

        const address = new AddressModel.create({
            user:userId,
            fullName,
            phone,
            street,
            city,
            pincode,
            state,
            country,
        })

        return res.status(201).json({
                success:true,
                message:"successfully created address"
        })

    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success:false,
            message:"something went wrong while adding address"
        })
    }
}

const getMyAddress = async (req,res) => {
    try {
        const userId = req.user.id;
        const user = await userModel.findById(userId);
        if(!user) {
            return res.status(400).json({
                success:false,
                message:"user not found"
            })
        } 

        const getAddress = await AddressModel.find({
            user:userId
        })
        if(getAddress.length == 0) {
            return res.status(404).json({
                success:false,
                message: "Address not found"
            })
        }

        return res.status(200).json({
            success: true,
            message:"successfully get an address",
            data:getAddress
        })
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success:false,
            message:"something went wrong while getting address"
        })
    }
}

const updateAddress = async (req,res) => {
    try {
        const addressId = req.params.addressId
        const address = await AddressModel.findById(addressId);
        if(!address) {
            return res.status(400).json({
                success:false,
                message:"something went wrong in url address"
            })
        }

        const userId = req.user.id;

        if(address.user.toString() != userId) {
            return res.status(404).json({
                success:false,
                message:"You can only delete your own address"
            })
        }
        const {
            fullName,
            phone,
            street,
            city,
            pincode,
            state,
            country,
        } = req.body
        const updateAddress = await AddressModel.findByIdAndUpdate(addressId, {
            fullName,
            phone,
            street,
            city,
            pincode,
            state,
            country,
        },
        {
            new : true
        }
    )

        return res.status(200).json({
            success:true,
            message:"successfully updated Address",
            data: updateAddress
        })
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success:false,
            message:"something went wrong while updating address"
        })
    }
}

const deleteAddress = async(req,res) => {
    try {
        const addressId = req.params.addressId;
        const address = await AddressModel.findById(addressId)
        if(!address) {
            return res.status(400).json({
                success:false,
                message:"something went wrong in url address"
            })
        }

        const userId = req.user.id;

        if(address.user.toString() != userId) {
            return res.status(404).json({
                success:false,
                message:"You can only delete your own address"
            })
        }

        const deleteAddress = await AddressModel.findByIdAndDelete(addressId)
        return res.status(200).json({
            success:true,
            message:"successfully deleted Address",
            data: deleteAddress
        })
    } catch(err) {
        console.log(err)
        return res.status(500).json({
            success:false,
            message:"something went wrong while deleting address"
        })
    }
}

module.exports = {
    addAddress,
    getMyAddress,
    updateAddress,
    deleteAddress
}