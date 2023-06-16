import { NextFunction, Request, Response, Router } from "express";
import Trips from "../../models/trip.model";
import googleMap from "../../services/google-map";
import config from "../../config/admin";

const router: Router = Router({ mergeParams: true });

router.use("/", (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.uid || req.user.account.type !== "regular-user") {
    return res.status(401).send({
      status: "error",
      message: "Unauthorized",
    });
  }

  return next();
});

router.get("/", async (req: Request<{ id: string }>, res: Response) => {
  if (!req.params.id) {
    return res.status(400).send({
      status: "error",
      message: "Invalid trip id",
    });
  }

  let trip;

  try {
    trip = await Trips.findOne({
      id: req.params.id,
      "sender.id": req.user._id,
    });
  } catch (err) {
    console.log("here1234567", err);

    return res.status(500).send({
      status: "error",
      message: "Something went wrong",
    });
  }

  if (!trip) {
    return res.status(404).send({
      status: "error",
      message: "Trip not found",
    });
  }

  const tripDetails: any = {};

  tripDetails.id = trip?.id;
  tripDetails.status = trip?.status;
  tripDetails.sender = {
    fullName: trip?.sender.fullName,
    phoneNumber: trip?.sender.phoneNumber,
  };
  tripDetails.receiver = trip?.receiver;
  tripDetails.vehicleType = trip?.vehicleType;
  tripDetails.tripType = trip?.tripType;
  tripDetails.categories = trip?.categories;
  tripDetails.createdAt = trip?.createdAt;
  tripDetails.updatedAt = trip?.updatedAt;
  tripDetails.pickupLocation = trip?.pickupLocation;
  tripDetails.dropoffLocation = trip?.dropoffLocation;

  if (
    !trip?.pickupLocation?.placeId ||
    !trip?.dropoffLocation?.placeId ||
    !trip?.pickupLocation?.lat ||
    !trip?.pickupLocation?.lng ||
    !trip?.dropoffLocation?.lat ||
    !trip?.dropoffLocation?.lng ||
    !trip?.vehicleType ||
    !trip?.tripType
  ) {
    return res.status(200).send({
      status: "success",
      message: "Trip details",
      data: {
        ...tripDetails,
        charge: null,
      },
    });
  }

  // calculate charge
  // const pickupLocationPlaceid = trip?.pickupLocation?.placeId;
  // const dropoffLocationPlaceid = trip?.dropoffLocation?.placeId;

  const tripMatrix = await googleMap
    .getDistanceAndDuration(
      [trip?.pickupLocation?.lat, trip?.pickupLocation?.lng],
      [trip?.dropoffLocation?.lat, trip?.dropoffLocation?.lng]
    )
    .catch((err) => {
      return null;
    });

  const rates = await config.get("tripRates");

  console.log("ratesssss:", rates.car, trip?.vehicleType, trip?.tripType);

  const rateDetails = rates[trip?.tripType][trip?.vehicleType];

  const tripMatrixDetails = tripMatrix?.data?.rows[0]?.elements[0];

  console.log("rates:", rateDetails, tripMatrixDetails);
  if (!tripMatrixDetails) {
    return res.status(400).json({
      status: "error",
      message: "Invalid start or destination",
      data: null,
    });
  }

  if (!rateDetails) {
    return res.status(500).send({
      status: "success",
      message: "trip details",
      data: {
        ...tripDetails,
        charge: null,
      },
    });
  }

  // const stateAndCountries = await Promise.all([
  //   googleMap.getStateAndCountry(dropoffLocationPlaceid),
  //   googleMap.getStateAndCountry(pickupLocationPlaceid),
  // ]).catch((err) => {
  //   return null;
  // });

  // if (!stateAndCountries) {
  //   console.log("here1234567!");

  //   return res.status(500).send({
  //     status: "error",
  //     message: "Something went wrong",
  //   });
  // }

  if (trip.tripType === "intraState") {
    const { distance, duration } = tripMatrixDetails;

    const totalDistance = distance.value / 1000;
    const totalDuration = duration.value / 60;

    // console.log(totalDistance, totalDuration);

    let totalFare =
      rateDetails.baseFare +
      totalDistance * rateDetails.perKm +
      totalDuration * rateDetails.perMinute +
      rateDetails.perDestination;

    totalFare = Math.round(totalFare);

    if (totalFare < rateDetails.minimunFare) {
      totalFare = rateDetails.minimunFare;
    }

    return res.status(200).send({
      status: "success",
      message: "Trip details",
      data: {
        ...tripDetails,
        charge: {
          totalFare: `NGN${totalFare}`,
          totalDistance: `${totalDistance}km`,
          totalDuration: `${totalDuration}min`,
          // rateDetails,
        },
      },
    });
    // const first
  } else {
    return res.status(200).send({
      status: "success",
      message: "Trip details",
      data: {
        ...tripDetails,
        charge: null,
      },
    });
  }
});

export default router;
