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
        enum: ["superadmin", "admin", "sales", "marketing", "inventory", "user"],
        default: "user",
    },
    department: {
        type: String,
        enum: [
            "sales", "marketing", "inventory",
            "production", "quality", "logistics", "management",
        ],
        default: null,
    },

    // Who created this user (the Admin's _id, or null for SuperAdmin-created admins)
    createdByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },

    // Which admin manages this user (same as createdByAdmin usually)
    managedByAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },

    employeeId: {
        type: String,
        unique: true,
        sparse: true,   // allows multiple nulls
    },

    isActive: {
        type: Boolean,
        default: true,
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