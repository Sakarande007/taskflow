import { Router } from 'express'
import { verifyForgotPasswordController, forgorPasswordController, updateUserDetails, logoutController, registerUserController, verifyEmailController ,loginController, uploadAvatar, resetPassword, refreshToken } from '../controllers/user.controllers.js'
//import { validateRegister, validateLogin } from '../middlewares/validateUser.js'
import auth  from '../middleware/auth.js'
import upload from '../middleware/multer.js'

const userRouter = Router()

userRouter.post('/register', registerUserController)
userRouter.post('/verify-email', verifyEmailController)
userRouter.post('/login',loginController)
userRouter.get('/logout',auth,logoutController)
userRouter.put('/upload-avatar',auth,upload.single('avatar'),uploadAvatar)
userRouter.put('/update-user',auth,updateUserDetails)
userRouter.put('/forgot-password',forgorPasswordController)
userRouter.put('/verify-forgot-password-otp',verifyForgotPasswordController)
userRouter.put('/reset-password',resetPassword)
userRouter.post('/refresh-token',refreshToken)

export default userRouter