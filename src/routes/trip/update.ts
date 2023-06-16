import { LatLng } from "@googlemaps/google-maps-services-js";
import { Router, Request, Response } from "express";
import { v4 } from "uuid";
import { isValidName } from "../../helpers";
import Phone from "../../helpers/lib-phone";
import Trip, { tripTypes } from "../../models/trip.model";
import googleMap from "../../services/google-map";
import { vehicleTypes } from "./get-details";
const router: Router = Router({ mergeParams: true });

// router.use("/", () => {
//   console.log("hello");
// });
const categories = [
  "chemicals",
  "clothes",
  "computer",
  "documents",
  "electronics",
  "fashion",
  "food",
  "health",
  "machines",
  "phones",
  "others",
];

router.post(
  "/",
  async (
    req: Request<
      { id: string },
      {},
      {
        vehicleType?: string;
        tripType?: string;
        sender?: {
          fullName?: string;
          phoneNumber?: string;
        };
        receiver?: {
          fullName: string;
          phoneNumber: string;
        };
        pickupLocation?: {
          address?: string;
          lat?: number;
          lng?: number;
          placeId: string;
        };
        dropoffLocation?: {
          address: string;
          lat: number;
          lng: number;
          placeId: string;
        };
        categories?: string[];
      }
    >,
    res: Response
  ) => {
    let errors = [];

    if (
      !req.user ||
      !req.user.uid ||
      req.user.account.type !== "regular-user"
    ) {
      return res.status(401).send({
        status: "error",
        message: "Unauthorized",
      });
    }

    let currentTrip;

    try {
      currentTrip = await Trip.findOne({
        id: req.params.id,
        "sender.id": req.user._id,
      });
      if (!currentTrip) {
        return res.status(404).send({
          status: "error",
          message: "Trip not found",
        });
      }
      if (currentTrip.status !== "draft") {
        return res.status(400).send({
          status: "error",
          message: "Trip no longer in draft",
        });
      }
    } catch (err) {
      return res.status(500).send({
        status: "error",
        message: "Something went wrong",
      });
    }

    const updateFields: any = {};

    if (req.body.vehicleType) {
      if (!vehicleTypes.includes(req.body.vehicleType)) {
        errors.push("Invalid vehicle type");
      } else {
        updateFields.vehicleType = req.body.vehicleType;
      }
    }

    if (req.body.tripType) {
      if (!tripTypes.includes(req.body.tripType)) {
        errors.push("Invalid trip type");
      } else {
        updateFields.tripType = req.body.tripType;
      }
    }

    if (req.body.sender) {
      if (!currentTrip.sender.id) {
        updateFields.sender = {
          id: req.user._id,
        };
      }

      if (req.body?.sender?.fullName || req.body?.sender?.phoneNumber) {
        updateFields.sender = {
          ...currentTrip?.sender,
          ...updateFields.sender,
        };
        console.log("updateFields.sender:", updateFields.sender);

        if (req.body.sender.fullName) {
          const names = req.body.sender.fullName.split(" ");

          for (let i = 0; i < names.length; i++) {
            if (names[i].length < 2) {
              errors.push("Invalid sender name");
            } else if (!isValidName(names[i])) {
              if (!errors.includes("Invalid sender name")) {
                errors.push("Invalid sender name");
              }
            }
          }

          console.log(
            "errors:",
            errors.includes("Invalid sender name"),
            "Invalid sender name"
          );

          if (!errors.includes("Invalid sender name")) {
            console.log("includes");

            updateFields.sender.fullName = req.body.sender.fullName;
          }
        }

        if (req.body.sender.phoneNumber) {
          let newNumber = req.body.sender.phoneNumber;

          const phone = new Phone();

          if (req?.body?.sender?.phoneNumber[0] !== "+") {
            newNumber = `+${req.body.sender.phoneNumber}`;
          }

          if (!phone.isValid(newNumber)) {
            errors.push("Invalid sender phone number");
          }

          const internationalNumber = phone.getInternationNumber(newNumber);
          if (!internationalNumber) {
            if (!errors.includes("Invalid sender phone number")) {
              errors.push("Invalid sender phone number");
            }
          }

          if (!errors.includes("Invalid sender phone number")) {
            updateFields.sender.phoneNumber = internationalNumber;
          }
        }
      }
    }

    if (req.body.receiver) {
      if (req.body?.receiver?.fullName || req.body?.receiver?.phoneNumber) {
        updateFields.receiver = {
          ...currentTrip?.receiver,
          ...updateFields.receiver,
        };
        console.log("updateFields.receiver:", updateFields.receiver);

        if (req.body.receiver.fullName) {
          const names = req.body.receiver.fullName.split(" ");
          for (let i = 0; i < names.length; i++) {
            if (names[i].length < 2) {
              errors.push("Invalid receiver name");
            } else if (!isValidName(names[i])) {
              if (!errors.includes("Invalid receiver name")) {
                errors.push("Invalid receiver name");
              }
            }
          }

          if (!errors.includes("Invalid receiver name")) {
            updateFields.receiver.fullName = req.body.receiver.fullName;
          }
        }

        if (req.body.receiver.phoneNumber) {
          let newNumber = req.body.receiver.phoneNumber;

          const phone = new Phone();

          if (req?.body?.receiver?.phoneNumber[0] !== "+") {
            newNumber = `+${req.body.receiver.phoneNumber}`;
          }

          if (!phone.isValid(newNumber)) {
            errors.push("Invalid receiver phone number");
          }

          const internationalNumber = phone.getInternationNumber(newNumber);
          if (!internationalNumber) {
            if (!errors.includes("Invalid receiver phone number")) {
              errors.push("Invalid receiver phone number");
            }
          }
          if (!errors.includes("Invalid receiver phone number")) {
            updateFields.receiver.phoneNumber = internationalNumber;
          }
        }
      }
    }

    if (req.body.pickupLocation) {
      if (!req.body.pickupLocation.placeId) {
        errors.push("Please pass pickup location placeId");
      }
      if (req.body.pickupLocation.placeId) {
        // get place id details
        try {
          const { data } = await googleMap.getPlaceDetails(
            req.body.pickupLocation.placeId
          );

          if (data.status === "OK") {
            //   updateFields.pickupLocation = {
            //     ...currentTrip?.pickupLocation,
            //     ...updateFields.pickupLocation,
            //     ...req.body.pickupLocation,
            //     ...data.result,
            //   };
            updateFields.pickupLocation = {
              address: data.results[0].formatted_address,
              lat: data.results[0].geometry.location.lat,
              lng: data.results[0].geometry.location.lng,
              placeId: data.results[0].place_id,
            };
          }

          console.log("placeDetails:", data);
        } catch (err: any) {
          console.log("err place id:", err?.response?.data);
          errors.push("Invalid pickup location placeId");
        }
      }
    }

    if (req.body.dropoffLocation) {
      if (!req.body.dropoffLocation.placeId) {
        errors.push("Please pass pickup location placeId");
      }
      if (req.body.dropoffLocation.placeId) {
        // get place id details
        try {
          const { data } = await googleMap.getPlaceDetails(
            req.body.dropoffLocation.placeId
          );

          if (data.status === "OK") {
            updateFields.dropoffLocation = {
              address: data.results[0].formatted_address,
              lat: data.results[0].geometry.location.lat,
              lng: data.results[0].geometry.location.lng,
              placeId: data.results[0].place_id,
            };
          }

          console.log("placeDetails:", data);
        } catch (err: any) {
          console.log("err place id:", err?.response?.data);
          errors.push("Invalid drop off location placeId");
        }
      }
    }

    if (req.body.categories) {
      // check if array of incoming categories is valid
      const validCategories = req.body.categories.every((category) =>
        categories.includes(category)
      );
      // get all invalid categories
      const invalidCategories = req.body.categories.filter(
        (category) => !categories.includes(category)
      );

      if (!validCategories) {
        errors.push(`Invalid category(s): ${invalidCategories.join(", ")}`);
      }

      if (validCategories) {
        updateFields.categories = req.body.categories.filter((category) =>
          categories.includes(category)
        );
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).send({
        status: "error",
        message: "No fields to update",
      });
    } else {
      try {
        const updatedTrip = await Trip.findOneAndUpdate(
          { id: req.params.id },
          { $set: updateFields },
          { new: true }
        );

        if (!updatedTrip) {
          return res.status(404).send({
            status: "error",
            message: "Trip not found",
          });
        }

        return res.status(200).send({
          status: "success",
          message: "Trip updated",
          data: {
            id: updatedTrip.id,
            status: updatedTrip.status,
          },
          // add errors if any
          errors: errors.length > 0 ? errors : null,
        });
      } catch (err) {
        console.log("err:", err);

        return res.status(500).send({
          status: "error",
          message: "Something went wrong",
        });
      }
    }
  }
);

// collect

export default router;
