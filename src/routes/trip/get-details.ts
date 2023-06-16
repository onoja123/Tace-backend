import { LatLng } from "@googlemaps/google-maps-services-js";
import { Router, Request, Response } from "express";
import googleMap from "../../services/google-map";
import config from "../../config/admin";

export const vehicleTypes = [
  "",
  "bike",
  "car",
  "miniVan",
  "van",
  "mediumTruck",
];

const router: Router = Router();

router.post(
  "/",
  async (
    req: Request<
      {},
      {},
      {
        start: string | { lat: number; lng: number };
        routes: string | string[] | LatLng | LatLng[];
        tripType: string;
        vehicleType: string;
      }
    >,
    res: Response
  ) => {
    const { start, routes, vehicleType } = req.body;
    console.log(req.body);

    if (!start || !routes || !vehicleType) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required",
        data: null,
      });
    }

    if (!vehicleTypes.includes(vehicleType)) {
      return res.status(400).json({
        status: "error",
        message: "Invalid vehicle type",
        data: null,
      });
    }

    const routesArray = Array.isArray(routes) ? routes : [routes];

    const tripMatrix = await googleMap.getDistanceAndDuration(
      start,
      routesArray
    );

    const rates = await config.get("tripRates");
    const ratesDetails = rates.intraState[vehicleType];

    if (!ratesDetails) {
      return res.status(400).json({
        status: "error",
        message: "Invalid vehicle type",
        data: null,
      });
    }

    const tripMatrixDetails = tripMatrix?.data?.rows[0]?.elements[0];

    if (!tripMatrixDetails) {
      return res.status(400).json({
        status: "error",
        message: "Invalid start or destination",
        data: null,
      });
    }

    const { distance, duration } = tripMatrixDetails;

    const totalDistance = distance.value / 1000;
    const totalDuration = duration.value / 60;

    console.log(totalDistance, totalDuration);

    let totalFare =
      ratesDetails.baseFare +
      totalDistance * ratesDetails.perKm +
      totalDuration * ratesDetails.perMinute +
      ratesDetails.perDestination;

    if (totalFare < ratesDetails.minimunFare) {
      totalFare = ratesDetails.minimunFare;
    }

    return res.status(200).json({
      status: "success",
      message: "Trip details",
      data: {
        totalDistance: distance.text,
        totalDuration: duration.text,
        baseFare: ratesDetails.baseFare,
        perKm: ratesDetails.perKm,
        perMinute: ratesDetails.perMinute,
        perTrip: ratesDetails.perDestination,
        totalFare,
      },
    });
  }
);

export default router;

// /**
//  * @openapi
//  * /api/v1/trip/get-trip-estimates:
//  *  post:
//  *    tags:
//  *     - trip
//  *    summary: Get trip estimates
//  *    description: Get trip estimates
//  *    requestBody:
//  *     content:
//  *      application/json:
//  *        schema:
//  *         type: object
//  *           properties:
//  *             start:
//  *               type:
//  *                 - string
//  *
//  *
//  *
//  *
//  *
//  * */
