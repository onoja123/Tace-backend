import { LatLng } from "@googlemaps/google-maps-services-js";
import { Router, Request, Response, NextFunction } from "express";
import Users, { driverOnlyTypes } from "../../models/user.model";

import config from "../../config/admin";
import googleMap from "../../services/google-map";
import { vehicleTypes } from "./get-details";
import Trip, { ITrip, tripTypes } from "../../models/trip.model";
import Phone from "../../helpers/lib-phone";
import { v4 } from "uuid";
import { encodeString, generateOtp, generateQrCodeURL } from "../../helpers";
import { io } from "../../websockets";

const router: Router = Router({ mergeParams: true });

router.use("/", (request: Request, response: Response, next: NextFunction) => {
  if (
    !request.user ||
    !request.user.uid ||
    request.user.account.type !== "regular-user"
  ) {
    return response.status(401).send({
      status: "error",
      message: "Unauthorized",
    });
  }

  return next();
});

router.post(
  "/",
  async (request: Request<{ id: string }>, response: Response) => {
    if (
      !request.user ||
      !request.user.uid ||
      request.user.account.type !== "regular-user"
    ) {
      return response.status(401).send({
        status: "error",
        message: "Unauthorized",
      });
    }
    let tripDetails: ITrip | null = null;

    try {
      tripDetails = await Trip.findOne({
        id: request.params.id,
        "sender.id": request.user._id,
      });
    } catch (err) {
      console.log("error:", err);
      return response.status(500).send({
        status: "error",
        message: "Internal server error",
      });
    }

    if (!tripDetails) {
      return response.status(404).send({
        status: "error",
        message: "Trip not found",
      });
    }

    if (tripDetails.status !== "draft") {
      return response.status(400).send({
        status: "error",
        message: "Trip is no longer pending",
      });
    }

    const errors = [];
    // make sure all required details are provided

    const {
      sender,
      receiver,
      pickupLocation,
      dropoffLocation,
      categories,
      vehicleType,
      tripType,
    } = tripDetails;
    if (!sender || !sender.fullName || !sender.phoneNumber) {
      errors.push("Sender details are required");
    }
    if (!receiver || !receiver.fullName || !receiver.phoneNumber) {
      errors.push("Receiver details are required");
    }

    if (
      !pickupLocation ||
      !pickupLocation.placeId ||
      !pickupLocation.lat ||
      !pickupLocation.lng
    ) {
      errors.push("Pickup location is required");
    }

    if (
      !dropoffLocation ||
      !dropoffLocation.placeId ||
      !dropoffLocation.lat ||
      !dropoffLocation.lng
    ) {
      errors.push("Dropoff location is required");
    }

    if (!categories || !categories.length) {
      errors.push("Categories are required");
    }

    if (!vehicleType || !vehicleTypes.includes(vehicleType)) {
      errors.push("Vehicle type is required");
    }

    if (!tripType || !tripTypes.includes(tripType)) {
      errors.push("Trip type is required");
    }

    if (errors.length) {
      return response.status(400).json({
        status: "error",
        message: "All fields are required",
        data: null,
        errors,
      });
    }

    if (tripDetails.tripType === "intraState") {
      const stateAndCountries = await Promise.all([
        googleMap.getStateAndCountry(pickupLocation.placeId),
        googleMap.getStateAndCountry(dropoffLocation.placeId),
      ]);

      if (
        !stateAndCountries[0].state ||
        !stateAndCountries[1].state ||
        !stateAndCountries[0].country ||
        !stateAndCountries[1].country
      ) {
        return response.status(400).json({
          status: "error",
          message: "Invalid start or destination",
          data: null,
        });
      }

      if (
        stateAndCountries[0].country !== stateAndCountries[1].country ||
        stateAndCountries[0].state !== stateAndCountries[1].state
      ) {
        return response.status(400).json({
          status: "error",
          message:
            "Pickup and dropoff locations must be in the same state and country",
          data: null,
        });
      }

      const rates = await config.get("tripRates");
      const rateDetails =
        rates[tripDetails?.tripType][tripDetails?.vehicleType];

      const tripMatrix = await googleMap
        .getDistanceAndDuration(
          [tripDetails?.pickupLocation.lat, tripDetails?.pickupLocation?.lng],
          [tripDetails?.dropoffLocation.lat, tripDetails?.dropoffLocation?.lng]
        )
        .catch((err) => {
          console.log("error:", err);
          return null;
        });
      const tripMatrixDetails = tripMatrix?.data?.rows[0]?.elements[0];

      if (
        !tripMatrixDetails ||
        !tripMatrixDetails.distance ||
        !tripMatrixDetails.duration ||
        tripMatrixDetails.status !== "OK"
      ) {
        return response.status(400).json({
          status: "error",
          message: "Invalid start or destination",
          data: null,
        });
      }

      const { distance, duration } = tripMatrixDetails;

      const totalDistance = distance.value / 1000;
      const totalDuration = duration.value / 60;

      let totalFare =
        rateDetails.baseFare +
        totalDistance * rateDetails.perKm +
        totalDuration * rateDetails.perMinute +
        rateDetails.perDestination;

      totalFare = Math.round(totalFare);

      if (totalFare < rateDetails.minimunFare) {
        totalFare = rateDetails.minimunFare;
      }

      const user = await Users.findOne({
        _id: request.user._id,
      });

      if (!user) {
        return response.status(400).json({
          status: "error",
          message: "Invalid user",
        });
      }

      if (user.walletBalance < totalFare) {
        return response.status(402).json({
          status: "error",
          message: "Insufficient balance",
        });
      }

      // update user wallet balance
      const updatedUser = await Users.findOneAndUpdate(
        {
          _id: request.user._id,
        },
        {
          $inc: {
            walletBalance: -totalFare,
          },
        },
        {
          new: true,
        }
      );

      if (!updatedUser) {
        return response.status(400).json({
          status: "error",
          message: "Unable to update user wallet balance",
        });
      }

      const dropoffCode = generateOtp(6);
      const pickupCode = generateOtp(6);
      const dropoffCodeEncoded = encodeString(dropoffCode);
      const pickupCodeEncoded = encodeString(pickupCode);

      const [dropoffCodeQr, pickupCodeQr] = await Promise.all([
        generateQrCodeURL(dropoffCode),
        generateQrCodeURL(pickupCode),
      ]);

      let updatedTripDetails;
      // update trip details

      try {
        updatedTripDetails = await Trip.findOneAndUpdate(
          {
            _id: tripDetails._id,
            "sender.id": request.user._id,
          },
          {
            $set: {
              dropOffCode: {
                code: dropoffCodeEncoded,
                qr: dropoffCodeQr,
              },
              pickUpCode: {
                code: pickupCodeEncoded,
                qr: pickupCodeQr,
              },
              charge: totalFare,
              // status: "pending",
            },
          }
        );
      } catch (err) {
        console.log("err:", err);
        return response.status(400).json({
          status: "error",
          message: "Unable to update trip details",
        });
      }

      if (!updatedTripDetails) {
        return response.status(400).json({
          status: "error",
          message: "Unable to update trip details",
        });
      }

      // all good send response to user and continue driver logic
      response.status(200).json({
        status: "success",
        message: "Trip created successfully look for a driver",
      });

      // send notification to driver within 5km radius
      Users.find({
        $and: [
          {
            "account.type": { $in: driverOnlyTypes },
          },
          {
            isAllowedToRide: true,
          },
          {
            vehicleType: vehicleType,
          },
          {
            isOnline: true,
          },
          {
            location: {
              $nearSphere: {
                $geometry: {
                  type: "Point",
                  coordinates: [
                    tripDetails.pickupLocation.lng,
                    tripDetails.pickupLocation.lat,
                  ],
                },
                $maxDistance: 5000, // km in meters
              },
            },
          },
        ],
      }).exec((err, results) => {
        const uids = results.map((driver) => driver.uid);
        io.to(uids).emit("newTrip", {
          trip: {
            _id: tripDetails?._id,
            pickupLocation: tripDetails?.pickupLocation,
            dropoffLocation: tripDetails?.dropoffLocation,
            charge: totalFare,
          },
        });
      });
    }
  }
);

// router.post(
//   "/",
//   async (
//     req: Request<
//       {},
//       {},
//       {
//         start: string | { lat: number; lng: number };
//         routes: string | string[] | LatLng | LatLng[];
//         tripType: string;
//         vehicleType: string;
//         receiver: {
//           fullName: string;
//           phoneNumber: string;
//         };
//       }
//     >,
//     res: Response
//   ) => {
//     if (!req.user || !req.user.uid || req.user.account.type !== "regular-user") {
//       return res.status(401).send({
//         status: "error",
//         message: "Unauthorized",
//       });
//     }
//     const { start, routes, vehicleType, tripType, receiver } = req.body;

//     if (!start || !routes || !vehicleType || !tripType || !receiver) {
//       return res.status(400).json({
//         status: "error",
//         message: "All fields are required",
//         data: null,
//       });
//     }

//     if (!receiver.fullName || !receiver.phoneNumber) {
//       return res.status(400).json({
//         status: "error",
//         message: "Receiver full name and phone number are required",
//         data: null,
//       });
//     }

//     let newNumber = receiver.phoneNumber;
//     const phone = new Phone();
//     if (receiver.phoneNumber[0] !== "+") {
//       newNumber = `+${receiver.phoneNumber}`;
//     }
//     if (!phone.isValid(newNumber)) {
//       return res.status(400).send({
//         status: "error",
//         message: "Invalid phone number",
//         data: null,
//       });
//     }

//     const internationalNumber = phone.getInternationNumber(newNumber);
//     if (!internationalNumber) {
//       return res.status(400).send({
//         status: "error",
//         message: "Invalid phone number",
//         data: null,
//       });
//     }

//     let recieverObj = {};

//     const recieverUser = await Users.findOne({
//       phoneNumber: newNumber,
//     });

//     if (recieverUser) {
//       recieverObj = {
//         fullName: receiver.fullName,
//         phoneNumber: newNumber,
//         id: recieverUser._id,
//       };
//     } else {
//       recieverObj = {
//         fullName: receiver.fullName,
//         phoneNumber: newNumber,
//       };
//     }

//     if (!vehicleTypes.includes(vehicleType)) {
//       return res.status(400).json({
//         status: "error",
//         message: "Invalid vehicle type",
//         data: null,
//       });
//     }

//     if (!tripTypes.includes(tripType)) {
//       return res.status(400).json({
//         status: "error",
//         message: "Invalid trip type",
//         data: null,
//       });
//     }

//     let newStart: any, newRoutes: Array<any>;
//     const rawRoutes = Array.isArray(routes) ? routes : [routes];
//     if (typeof start === "string") {
//       newStart = `place_id:${start}`;
//     } else {
//       newStart = start;
//     }
//     newRoutes = rawRoutes.map((route: any) => {
//       if (typeof route === "string") {
//         return `place_id:${route}`;
//       } else {
//         return route;
//       }
//     });

//     let tripMatrix;

//     try {
//       tripMatrix = await googleMap.getDistanceAndDuration(newStart, newRoutes);
//     } catch (e) {
//       return res.status(400).json({
//         status: "error",
//         message: "Invalid start or destination",
//         data: null,
//       });
//     }

//     const rates = await config.get("tripRates");
//     const ratesDetails = rates.intraState[vehicleType];

//     if (!ratesDetails) {
//       return res.status(400).json({
//         status: "error",
//         message: "Invalid vehicle type",
//         data: null,
//       });
//     }

//     const tripMatrixDetails = tripMatrix?.data?.rows[0]?.elements[0];

//     if (
//       !tripMatrixDetails ||
//       !tripMatrixDetails.distance ||
//       !tripMatrixDetails.duration ||
//       tripMatrixDetails.status !== "OK"
//     ) {
//       return res.status(400).json({
//         status: "error",
//         message: "Invalid start or destination",
//         data: null,
//       });
//     }

//     const { distance, duration } = tripMatrixDetails;

//     const totalDistance = distance.value / 1000;
//     const totalDuration = duration.value / 60;

//     // console.log(totalDistance, totalDuration);

//     let totalFare =
//       ratesDetails.baseFare +
//       totalDistance * ratesDetails.perKm +
//       totalDuration * ratesDetails.perMinute +
//       ratesDetails.perDestination;

//     if (totalFare < ratesDetails.minimunFare) {
//       totalFare = ratesDetails.minimunFare;
//     }

//     const user = await Users.findOne({
//       uid: req.user.uid,
//     });

//     if (!user) {
//       return res.status(400).json({
//         status: "error",
//         message: "Invalid user",
//       });
//     }

//     const walletBalance = user.walletBalance;
//     console.log(walletBalance, totalFare);

//     if (walletBalance < totalFare.toFixed(2)) {
//       return res.status(402).json({
//         status: "error",
//         message: "Insufficient balance",
//       });
//     }

//     const startPosition: any = start;
//     const endPosition: any = rawRoutes[rawRoutes.length - 1];

//     const stateAndCountries = await Promise.all([
//       googleMap.getStateAndCountry(startPosition),
//       ...rawRoutes.map((route: any) => googleMap.getStateAndCountry(route)),
//     ]);
//     console.log(stateAndCountries, "stateAndCountries");

//     switch (tripType) {
//       case "intraState": {
//         const firstStateAndCountry = stateAndCountries[0];
//         const isSame = stateAndCountries.every(
//           (stateAndCountry) =>
//             stateAndCountry.state === firstStateAndCountry.state &&
//             stateAndCountry.country === firstStateAndCountry.country
//         );

//         if (!isSame) {
//           return res.status(400).json({
//             status: "error",
//             message:
//               rawRoutes.length > 1
//                 ? "Either of your location is not on same state with your pickup location"
//                 : "Your destination is not on same state with your pickup location",
//           });
//         }

//         break;
//       }
//     }

//     //get ip address from start and end position
//     // console.log(recieverObj);

//     // remove from user wallet
//     const newWalletBalance = walletBalance - totalFare.toFixed(2);

//     try {
//       await Users.updateOne(
//         {
//           uid: req.user.uid,
//         },
//         {
//           $set: {
//             walletBalance: newWalletBalance,
//           },
//         }
//       );
//     } catch (e) {
//       console.log("err:", e);
//       return res.status(500).json({
//         status: "error",
//         message: "Internal server error",
//       });
//     }

//     const dropOffCode = generateOtp(6);
//     const pickUpCode = generateOtp(6);
//     const dropOffCodeEncoded = encodeString(dropOffCode);
//     const pickUpCodeEncoded = encodeString(pickUpCode);

//     const [dropOffCodeQr, pickUpCodeQr] = await Promise.all([
//       generateQrCodeURL(dropOffCode),
//       generateQrCodeURL(pickUpCode),
//     ]);

//     const trip = new Trip({
//       id: v4(),
//       type: tripType,
//       sender: user._id,
//       receiver: recieverObj,
//       dropOffCode: {
//         code: dropOffCodeEncoded,
//         qr: dropOffCodeQr,
//       },
//       pickUpCode: {
//         code: pickUpCodeEncoded,
//         qr: pickUpCodeQr,
//       },
//       status: "pending",
//       createdAt: new Date(),
//       charge: totalFare.toFixed(2),
//       pickupLocation: {
//         lat: stateAndCountries[0].lat,
//         lng: stateAndCountries[0].lng,
//         address: stateAndCountries[0].address,
//         placeId: stateAndCountries[0].placeId,
//       },
//       routes: rawRoutes.map((route: any, index: number) => ({
//         lat: stateAndCountries[index + 1].lat,
//         lng: stateAndCountries[index + 1].lng,
//         address: stateAndCountries[index + 1].address,
//         placeId: stateAndCountries[index + 1].placeId,
//       })),
//     });

//     try {
//       const tripItem = await trip.save();
//       if (!tripItem) {
//         return res.status(500).json({
//           status: "error",
//           message: "Internal server error",
//         });
//       }

//       // send notification to drivers withing 5km
//       // const yuy = await Users.find({
//       //   "account.type": "driver",
//       // });
//       // console.log(yuy, "yuy");

//       // console.log();
//       console.log(stateAndCountries[0].lat, stateAndCountries[0].lng);

//       Users.find({
//         "account.type": "driver",
//         isAllowedToRide: true,
//         vehicleType: vehicleType,
//         isOnline: true,
//         location: {
//           $nearSphere: {
//             $geometry: {
//               type: "Point",
//               coordinates: [stateAndCountries[0].lng, stateAndCountries[0].lat],
//             },
//             $maxDistance: 3000, // km in meters
//           },
//         },
//       }).exec((err, results) => {
//         // results is an array of events within 1km of the specified coordinates
//         console.log(
//           results.map((e) => e.location.coordinates),
//           err,
//           "results"
//         );
//         results.forEach((driver) => {
//           console.log(driver.uid, "driver.uid");

//           io.to(driver.uid).emit("newTrip", {
//             trip: tripItem,
//           });
//         });
//         // io.to("183c4383-5972-4ae3-82ab-8ec9c25f9026").emit("newTrip", {
//         //   trip: tripItem,
//         // });

//         // i
//         // io.emit("newTrip", {
//         //   trip: tripItem,
//         //   drivers: results,
//         // });
//         // setTimeout(() => {
//         //   console.log(results, "results");
//         // }, 3000);
//       });
//       // console.log(available, "available");
//       return res.status(200).json({
//         status: "success",
//         message: "trip created looking for a driver for you!",
//       });
//     } catch (e) {
//       console.log(e);
//       return res.status(500).json({
//         status: "error",
//         message: "Internal server error",
//       });
//     }
//   }
// );

export default router;
