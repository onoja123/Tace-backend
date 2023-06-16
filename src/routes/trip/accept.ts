import { Router, Request, Response } from "express";
import fcm from "../../controllers/firebase/fcm";
import Trips from "../../models/trip.model";
import FCMTokens from "../../models/firebase-tokens.model";
import { ridersOnlyDriverTypes } from "../../models/user.model";
const router: Router = Router({ mergeParams: true });

router.use("/", (req: Request, res: Response) => {
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
});

router.post("/", async (req: Request<{ id: string }>, res: Response) => {
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

  //   if (trip.status !== "pending" && trip.driver !== req.user._id) {
  //     return res.status(400).send({
  //       status: "error",
  //       message: "Trip is not pending",
  //     });
  //   }

  if (trip.driver && trip.driver !== req.user._id) {
    return res.status(400).send({
      status: "error",
      message: "Trip is already accepted by another driver",
    });
  }

  if (trip.driver && trip.driver === req.user._id) {
    return res.status(200).send({
      status: "success",
      message: "Trip is already accepted by you",
    });
  }

  trip.driver = req.user._id;
  trip.status = "pickup-pending";

  await trip.save();

  // fcm.sendToMultipleDevices()
  // get user's fcm token
  let tokensArray: string[] = [];

  try {
    const tokens = await FCMTokens.find({
      user: trip.sender,
    });

    if (tokens && tokens.length > 0) {
      tokensArray = tokens.map((token) => token.token);
    } else {
      console.log(`Error sending notification to user`);
    }
  } catch (err) {
    console.log(`Error sending notification to user: ${err}`);
  }

  const payload = {
    title: "Trip Accepted",
    body: `Your trip has been accepted by ${req.user.firstname}`,
  };
  fcm.sendToMultipleDevices(tokensArray, payload.title, payload.body);

  return res.status(200).send({
    status: "success",
    message: "Trip accepted successfully",
  });
});

export default router;
