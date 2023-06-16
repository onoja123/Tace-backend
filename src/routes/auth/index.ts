import { Router } from "express";
import UserPhoneOtp from "./phone-otps/user";
import DriverPhoneOtp from "./phone-otps/driver";
import authMiddleware from "../../middlewares/auth";
const router: Router = Router();

router.use(
  "/user/otp",
  // (_, __, next) => {
  //   // console.log(req.body, req.ip);
  //   return next();
  // },
  UserPhoneOtp
);
router.use("/driver/otp", DriverPhoneOtp);

export default router;
