import { Router, Request, Response } from "express";
import authMiddleware from "../middlewares/auth";
import Auth from "./auth";
import Maps from "./maps";
import User from "./user";
import Driver from "./driver";
import Trip from "./trip";
import Payment from "./payments";
import Webhook from "./webhooks";
import General from "./general";
import Coperate from "./driver/coperate";
const router: Router = Router();

/*/ handles all auth services like signup/login reset password /*/
router.use(
  "/auth",
  authMiddleware({
    allowUnauthorized: true,
  }),
  Auth
);

router.use("/maps", Maps);

// user handlers
router.use("/user", authMiddleware(), User);
// Driver Handlers
router.use("/driver", authMiddleware(), Driver);

router.use("/coperate", authMiddleware(), Coperate);

router.use("/trip", Trip);

router.use("/payments", authMiddleware(), Payment);

router.use("/webhook", Webhook);

router.use("/", General);

export default router;
