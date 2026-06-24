const User = require('../models/user')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const signupUser = async(req,res) => {
    try {
        const{name,email,password,role} = req.body;
        if(!name || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message : "All feilds are Required"
            })
        }
        const existingUser = await User.findOne({
            email
        })

        if(existingUser) {
            return res.status(400).json({
                success: false,
                message : "Already Exists User"
            })
        }
        const hashedPassword = await bcrypt.hash(
            password,
            10
        )
        const newUser = new User ({
            name,
            email,
            password :  hashedPassword,
            role
        })

        
        await newUser.save()
        return res.status(201).json({
            success: true,
            message : "User Created Successfully",
            data: newUser
        })
    } catch(err) {
    console.log(err);
    return res.status(500).json({
        success:false,
        message:"Internal Server Error"
    })
}
    
}


const loginUser = async (req,res) => {
    const{email, password} = req.body
    if(!email || !password) {
        return res.status(400).json({
            success : false,
            message : "All feilds are required"
        })
    }
    const existingUser = await User.findOne({
        email
    })

    if(!existingUser) {
        return res.status(400).json({
            success : false,
            message : "user is not existing"
        })
    }

    const isMatch = await bcrypt.compare(
        password,
        existingUser.password
    )

    if(!isMatch) {
        return res.status(400).json({
            success : false,
            message: "Password is not match"
        })
    }

    const token = jwt.sign(
        {
            id: existingUser._id,
            role: existingUser.role
        },
        process.env.JWT_SECRET,
        {expiresIn: "7d"}
    )
    return res.status(200).json({
        success: true,
        token,
        message: "successfully login user",
        
    })
}

const profile = async (req,res) => {
    try {
        const user = await User.findById(
        req.user.id
    ).select("-password")
    if(!user) {
        return res.status(401).json({
            success:false,
            message: "user not found"
        })
    }
    return res.status(200).json({
        success:true,
        message : "user successfully start",
        user
    })
    } catch(err) {
        return res.status(500).json({
            success:false,
            message: "something went wrong.."
        })
    }
    
}

module.exports = {
    signupUser,
    loginUser,
    profile
}