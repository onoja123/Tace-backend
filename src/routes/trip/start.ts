import { Router, Request, Response, NextFunction } from "express";
import { decodeString } from "../../helpers";
import Trips from "../../models/trip.model";
import { ridersOnlyDriverTypes } from "../../models/user.model";
const router: Router = Router({ mergeParams: true });

router.use("/", (req: Request, res: Response, next: NextFunction) => {
  if (
    !req.user ||
    !req.user.uid ||
    !ridersOnlyDriverTypes.includes(req.user.account.type)
  ) {
    return res.status(401).send({
      status: "error",
      message: "Unauthorized",
    });
  }
  return next();
});

router.post(
  "/",
  async (
    req: Request<
      { id: string },
      {},
      {
        pickupCode: string;
      }
    >,
    res: Response
  ) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).send({
        status: "error",
        message: "Trip id is required",
      });
    }

    const trip = await Trips.findOne({
      id: id,
    });

    if (!trip) {
      return res.status(404).send({
        status: "error",
        message: "Trip not found",
      });
    }

    if (trip.driver && trip.driver !== req.user._id) {
      return res.status(400).send({
        status: "error",
        message: "Trip is already accepted by another driver",
      });
    }

    if (trip.status !== "pickup-pending" && trip.driver === req.user._id) {
      return res.status(400).send({
        status: "error",
        message: "Trip is already in progress",
      });
    }

    if (trip.status === "pickup-pending" && trip.driver === req.user._id) {
      if (!req.body.pickupCode) {
        return res.status(400).send({
          status: "error",
          message: "Pickup code is required",
        });
      }

      const pickupCode = req.body.pickupCode;
      const pickUpCodeEncoded = trip.pickupCode.code;

      let decodedPickupCode;

      try {
        decodedPickupCode = await decodeString(pickUpCodeEncoded);
      } catch (err) {
        console.log("Error decoding pickup code", err);
        return res.status(500).send({
          status: "error",
          message: "Unable to process request",
        });
      }

      if (pickupCode !== decodedPickupCode) {
        return res.status(400).send({
          status: "error",
          message: "Invalid pickup code",
        });
      }

      trip.status = "in-progress";

      await trip.save();

      return res.status(200).send({
        status: "success",
        message: "Trip is in progress",
      });
    } else {
      return res.status(400).send({
        status: "error",
        message: "unable to process request",
      });
    }

    //   if (trip.status !== "pending" && trip.driver !== req.user._id) {
    //     return res.status(400).send({
    //       status: "error",
    //       message: "Trip is not pending",
    //     });
  }
);

export default router;
