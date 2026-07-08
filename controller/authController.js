const User = require('../models/user')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

const signupUser = async(req,res) => {
    try {
        const{name,email,password} = req.body;
        if(!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message : "All fields are Required"
            })
        }
        const existingUser = await User.findOne({
            email
        })

        if(existingUser) {
            return res.status(409).json({
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
            
        })

        
        await newUser.save()
        return res.status(201).json({
            success: true,
            message : "User Created Successfully",
            
        })
    } catch(err) {
    console.error(err);
    return res.status(500).json({
        success:false,
        message:"Internal Server Error"
    })
}
    
}


const loginUser = async (req,res) => {
    try{
        const{email, password} = req.body
    if(!email || !password) {
        return res.status(400).json({
            success : false,
            message : "All feilds are required"
        })
    }
   const existingUser = await User.findOne({ email }).select("+password");

    if(!existingUser) {
        return res.status(401).json({
            success : false,
            message : "Invalid email or password"
        })
    }

    const isMatch = await bcrypt.compare(
        password,
        existingUser.password
    )

    if(!isMatch) {
        return res.status(401).json({
            success : false,
            message: "Invalid email or password"
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
    } catch(err) {
        console.error(err);
        return res.status(500).json({
        success:false,
        message:"Internal Server Error"
    })
    }
}

const profile = async (req,res) => {
    try {
        const user = await User.findById(
        req.user.id
    ).select("-password")
    if(!user) {
        return res.status(404).json({
            success:false,
            message: "user not found"
        })
    }
    return res.status(200).json({
        success:true,
        message:"User profile fetched successfully",
        user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    }
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





//Why are you using req.user.id instead of req.params.id?"



//"The profile API should return the currently 
// logged-in user's profile. The req.user.id is
//  added by the authentication middleware after 
// verifying the JWT token, so the user cannot 
// access another user's profile simply by changing 
// the URL."