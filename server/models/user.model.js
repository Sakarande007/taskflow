import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: [true, "Please provide name"]
    },
    email: {
        type: String,
        required: [true, "Please provide email"],
        unique: true  
    },
    password: {
        type: String,
        required: [true, "Please provide password"]
    },
    avatar: {
        type: String,
        default: null
    },
    mobile: {
        type: String,
        default: null
    },
    role: {
        type: String,
        enum: ["employee", "admin", "customer"],
        default: "employee"
    },
    department: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    refresh_token: {
        type: String,
        default: ""
    },
    verify_email: {
        type: Boolean,
        default: false
    },
    last_login_date: {
        type: Date,
        default: ""
    },
    status: {
        type: String,
        enum: ["Active", "Inactive", "Suspended"],
        default: "Active"
    },
    forgot_passward_otp: {
        type: String,
        default: null
    },
    forgot_passward_expiry: {
        type: Date,
        default: ""
    },
      
}, {
    timestamps : true
})

const UserModel = mongoose.model("User", userSchema)

export default UserModel