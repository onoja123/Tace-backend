import { Request, Router, Response, NextFunction } from "express";
import Users from "../../models/user.model";

const router: Router = Router();

router.use("/", (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.uid || req.user.account.type !== "admin") {
    return res.status(404).send({
      status: "error",
      message: "page not found",
    });
  }
  next();
});

//get users
// router.get("/users", (req: Request, res: Response) => {
//     const filter =
// });

router.get("/users/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).send({
        status: "error",
        message: "invalid or missing id",
      });
    }

    // get user details
    const user = await Users.findOne({
      $or: [],
    });
  } catch {}
});

// get user

//get verifications

//get verification

//get payments

//get payment

export default router;
