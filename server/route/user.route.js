import { Router } from 'express'
import { verifyForgotPasswordController, forgorPasswordController, updateUserDetails, logoutController, registerUserController, verifyEmailController ,loginController, uploadAvatar, resetPassword, refreshToken, getUserProfile } from '../controllers/user.controllers.js'
//import { validateRegister, validateLogin } from '../middlewares/validateUser.js'
import auth  from '../middleware/auth.js'
import upload from '../middleware/multer.js'
import { authLimiter } from '../middleware/rateLimiter.js'

const userRouter = Router()

userRouter.post('/register', authLimiter, registerUserController)
userRouter.post('/verify-email', verifyEmailController)
userRouter.post('/login', authLimiter, loginController)
userRouter.get('/logout',auth,logoutController)
userRouter.put('/upload-avatar',auth,upload.single('avatar'),uploadAvatar)
userRouter.put('/update-user',auth,updateUserDetails)
userRouter.put('/forgot-password',forgorPasswordController)
userRouter.put('/verify-forgot-password-otp',verifyForgotPasswordController)
userRouter.put('/reset-password',resetPassword)
userRouter.post('/refresh-token',refreshToken)
userRouter.get('/profile', auth, getUserProfile)

export default userRouter