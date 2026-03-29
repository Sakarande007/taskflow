// server/Utils/generatedAccessToken.js
import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";
import dotenv from "dotenv";
dotenv.config();

const generatedAccessToken = async (userId) => {
  const user = await UserModel.findById(userId).select("role");
  const token = jwt.sign(
    { id: userId, role: user.role },         // include role
    process.env.SECRET_KEY_ACCESS_TOKEN,
    { expiresIn: "5h" }                      // kept at 5h for dev convenience
  );
  return token;
};

export default generatedAccessToken;