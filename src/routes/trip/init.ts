import { Router, Request, Response } from "express";
import { v4 } from "uuid";
import Trip from "../../models/trip.model";
const router: Router = Router();

router.post("/", (req: Request, res: Response) => {
  if (!req.user || !req.user.uid || req.user.account.type !== "regular-user") {
    return res.status(401).send({
      status: "error",
      message: "Unauthorized",
    });
  }

  const trip = new Trip({
    sender: {
      id: req.user._id,
    },
    status: "draft",
    id: v4(),
    createdAt: new Date(),
  });

  trip
    .save()
    .then((trip) => {
      return res.status(200).send({
        status: "success",
        message: "Trip created",
        data: {
          id: trip.id,
          status: trip.status,
        },
      });
    })
    .catch((err) => {
      console.log("err:", err);

      return res.status(500).send({
        status: "error",
        message: "Something went wrong",
      });
    });
});

export default router;
