const mongoose  =  require("mongoose")

const AddressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required : true,
        ref: "User"
    },

    fullName: {
        type:String,
        required : true
    },
    phone: {
        type: String,
        required: true
    },
    street: {
        type:String,
        required: true
    },
    city: {
        type:String,
        required:true
    },
    state: {
        type:String,
        required: true
    },
    pincode: {
        type:String,
        required:true
    },
    country: {
        type:String,
        required : true
    },
    isDefault : {
        type:Boolean,
        default:false
    }
}, {timestamps:true})

const AddressModel = mongoose.model("Address", AddressSchema);
module.exports = AddressModel