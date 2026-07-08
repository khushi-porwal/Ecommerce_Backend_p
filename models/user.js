const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true,
        trim:true
    },
    email : {
        type: String,
        required: true,
        unique: true,
        trim:true
    },

    password : {
        type : String,
        required: true,
        minLength: 8,
        select:false
    },
    role : {
        type: String,
        enum : ["user", "admin"],
        default : "user",
        required: true
    }
},
{
    timestamps: true
})

const userModel = mongoose.model("User", UserSchema)
module.exports = userModel