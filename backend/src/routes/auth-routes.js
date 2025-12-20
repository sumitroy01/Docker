import express from "express";
import { protectRoute } from "../middleware/auth-middleware.js";
import {
  logIn,
  signUp,
  checkAuth,
  logOut,
  requestResetPassword,
  resetPassword,
  verifyUser,
  resendOtp,
  healthCheck,
  
} from "../controllers/auth-controllers.js";

const router = express.Router();

//  basic
router.post("/signup", signUp);
router.post("/login", logIn);
router.post("/logout", protectRoute, logOut);
router.get("/check", protectRoute, checkAuth);

router.post("/resend-otp",resendOtp);

router.post("/verify-user", verifyUser); 

// password reset 
router.post("/password/request-reset", requestResetPassword); 
router.post("/password/reset", resetPassword);               

router.get("/health", healthCheck);
router.get("/me", protectRoute, checkAuth);

export default router;
