// server/middleware/auth.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const auth = async (request, response, next) => {
  try {
    const token =
      request.cookies?.accessToken ||
      request.headers?.authorization?.split(" ")[1];

    if (!token) {
      return response.status(401).json({
        message: "Authentication token required",
        error: true,
        success: false,
      });
    }

    const decode = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);

    if (!decode) {
      return response.status(401).json({
        message: "Invalid or expired token",
        error: true,
        success: false,
      });
    }

    request.userId   = decode.id;
    request.userRole = decode.role; // attach role for downstream guards
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return response.status(401).json({
        message: "Token expired",
        error: true,
        success: false,
        code: "TOKEN_EXPIRED",
      });
    }
    return response.status(401).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

export default auth;