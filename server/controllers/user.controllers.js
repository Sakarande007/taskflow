import sendEmail from "../config/sendEmail.js";
import UserModel from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import verifyEmailTemplate from "../Utils/verifyEmailTemplate.js";
import { request } from "express";
import generatedAccessToken from "../Utils/generatedAccessToken.js";
import generatedRefreshToken from "../Utils/generatedRefreshToken.js";
import upload from "../middleware/multer.js";
import uploadImageClodinary from "../Utils/uploadImageClodinary.js";
import generatedOtp from "../Utils/generatedOtp.js";
import ForgotPasswordTemplate from "../Utils/forgotPasswordTemplate.js";
import forgotPasswordTemplate from "../Utils/forgotPasswordTemplate.js";
import jwt from "jsonwebtoken";

export async function registerUserController(request, response) {
  try {
    const { name, email, password } = request.body;

    if (!name || !email || !password) {
      return response.status(400).json({
        message: "Provide Email, Name, Password",
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findOne({ email });

    if (user) {
      return response.json({
        message: "User already exists",
        error: true,
      });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

    const payload = {
      name,
      email,
      password: hashedPassword,
    };

    const newUser = new UserModel(payload);
    const result = await newUser.save();

    const VerifyEmailUrl = `${process.env.FRONTEND_URL}/verfiy-email?codes=${result?._id}`;

    const VerifyEmail = await sendEmail({
      sendTo: email,
      subject: "Verify Email from Blinkit",
      html: verifyEmailTemplate({
        name,
        url: VerifyEmailUrl,
      }),
    });

    return response.json({
      message: "User created successfully",
      error: false,
      success: true,
      data: result,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

export async function verifyEmailController(request, response) {
  try {
    const { codes } = request.body;

    const user = await UserModel.findOne({ _id: codes });
    if (!user) {
      return response.status(404).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    const updateUser = await UserModel.updateOne(
      { _id: codes },
      {
        verify_email: true,
      }
    );

    return response.json({
      message: "Email verified successfully",
      error: false,
      success: true,
      
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//Login Controller

export async function loginController(request, response) {
  try {
    const { email, password } = request.body;

    if (!email || !password) {
      return response.status(400).json({
        message: "Email and password are required",
        error: true,
        success: false,
      });
    }

    const user = await UserModel.findOne({ email , verify_email: false });

    if (!user) {
      return response.status(404).json({
        message: " User Not Register",
        error: true,
        success: false,
      });
    }
    if (user.status !== "Active") {
        return response.status(404).json({
        message: "User is not active",
        error: true,
        success: false,
      });
      // const deleteuser = await UserModel.deleteOne({ _id: user._id })
    }

    const checkPassword = await bcryptjs.compare(password, user.password);

    if (!checkPassword) {
      return response.status(404).json({
        message: "Invalid Password",
        error: true,
        success: false,
      });
    }
    const accesstoken = await generatedAccessToken(user._id);
    const refreshToken = await generatedRefreshToken(user._id);

    const cookiesOption = {
      httpOnly: true,
      secure: false,
      sameSite: "None",
    };

    response.cookie("accessToken", accesstoken, cookiesOption);
    response.cookie("refreshToken", refreshToken, cookiesOption);

    return response.json({
      message: "Login Successfull",
      error: false,
      success: true,
      data: {
        accesstoken,
        refreshToken,
      },
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

// Logout Controller

export async function logoutController(request, response) {
  try {
    const userId = request.userId; //Middleware

    const cookiesOption = {
      httpOnly: true,
      secure: false,
      sameSite: "None",
    };
    response.clearCookie("accesstoken");
    response.clearCookie("refreshToken");

    const removeRefreshToken = await UserModel.findByIdAndUpdate(userId, {
      refresh_token: "",
    });

    return response.json({
      message: "Logout Successfull",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//upload User Avatar

export async function uploadAvatar(request, response) {
  try {
    const userId = request.userId; //Middleware
    const image = request.file; //multrt middleware

    const upload = await uploadImageClodinary(image);

    const updateUser = await UserModel.findByIdAndUpdate(userId, {
      avatar: upload.url,
    });

    return response.json({
      message: "Avatar uploaded successfully",
      data: {
        _id: userId,
        avatar: upload.url,
      },
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//upadate User Details

export async function updateUserDetails(request, response) {
  try {
    const userId = request.userId; //Middleware
    const { name, email, mobile, password } = request.body;

    let hashpassword = "";
    if (password) {
      const salt = await bcryptjs.genSalt(10);
      hashpassword = await bcryptjs.hash(password, salt);
    }

    const updateUser = await UserModel.updateOne(
      { _id: userId },
      {
        ...(name && { name: name }),
        ...(email && { email: email }),
        ...(mobile && { mobile: mobile }),
        ...(password && { password: hashpassword }),
      }
    );

    return response.json({
      message: "User details updated successfully",
      error: false,
      success: true,
      data: updateUser,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//Forgot Password not login

export async function forgorPasswordController(request, response) {
  try {
    const { email } = request.body;
    const user = await UserModel.findOne({ email: email });
    if (!user) {
      return response.status(404).json({
        message: "Email not found",
        error: true,
        success: false,
      });
    }

    const otp = generatedOtp();
    const expireTime = Date.now() + 60 * 60 * 1000; // 1 hour

    const update = await UserModel.findByIdAndUpdate(user._id, {
      forgot_passward_otp: otp,
      forgot_passward_expiry: new Date(expireTime).toISOString(),
    });

    await sendEmail({
      sendTo: email,
      subject: "Forgot Password From Blinkit",
      html: forgotPasswordTemplate({
        name: user.name,
        otp: otp,
      }),
    });

    return response.json({
      message: "Otp sent to your email",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

// Verify forgot Password

export async function verifyForgotPasswordController(request, response) {
  try {
    const { otp, email } = request.body;

    if ((!email, !otp)) {
      return response.status(400).json({
        message: "Email and otp are required",
        error: true,
        success: false,
      });
    }
    const user = await UserModel.findOne({ email: email });
    if (!user) {
      return response.status(404).json({
        message: "Email not found",
        error: true,
        success: false,
      });
    }

    const currentTime = new Date().toISOString();

    if (user.forgot_passward_expiry < currentTime) {
      return response.status(400).json({
        message: "Otp expired",
        error: true,
        success: false,
      });
    }

    if (otp !== user.forgot_passward_otp) {
      return response.status(400).json({
        message: "Invaild OTP",
        error: true,
        success: false,
      });
    }

    return response.json({
      message: "OTP verified successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

// Reset Password

export async function resetPassword(request, response) {
  try {
    const { email, newPassword, confirmPassword } = request.body;

    const user = await UserModel.findOne({ email });
    if (!user || !newPassword || !confirmPassword) {
      return response.status(404).json({
        message: "Email, Password not provided",
        error: true,
        success: false,
      });
    }
    // const user = await UserModel.findOne({ email })

    if (!user) {
      return response.status(400).json({
        message: "User not found",
        error: true,
        success: false,
      });
    }

    if (newPassword !== confirmPassword) {
      return response.status(400).json({
        message: "Password and Confirm Password should not be different",
        error: true,
        success: false,
      });
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(newPassword, salt);

    const update = await UserModel.findByIdAndUpdate(user._id, {
      password: hashedPassword,
    });

    return response.status(200).json({
      message: "Password Reset Successfully",
      error: false,
      success: true,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

//Refreah Token Controller

export async function refreshToken(request, response) {
  try {
    const refreshToken =
      request.cookies.refreshToken ||
      request?.header?.authorization?.split(" ")[1];

    if (!refreshToken) {
      return response.status(401).json({
        message: "Unauthorized",
        error: true,
        success: false,
      });
    }

    const verfiyToken = await jwt.verify(
      refreshToken,
      process.env.SECRET_KEY_REFRESH_TOKEN
    );

    if (!verfiyToken) {
      return response.status(401).json({
        message: "Token is Expired",
        error: true,
        success: false,
      });
    }

    const userId = verfiyToken?._id;

    const newAccessToken = await generatedAccessToken(userId);

    const cookiesOption = {
      httpOnly: true,
      secure: false,
      sameSite: "None",
    };

    response.cookie("accesstoken", newAccessToken, cookiesOption);

    return response.json({
      message: "Refresh Token Success",
      error: false,
      success: true,
      data: {
        accesstoken: newAccessToken,
      },
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}
