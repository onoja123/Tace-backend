import { Request, Router, Response, NextFunction } from "express";
import { v4 } from "uuid";
import validateColor from "validate-color";
import {
  encodeString,
  getCountryDetails,
  isValidCountry,
  isValidName,
} from "../../helpers";
import Phone from "../../helpers/lib-phone";
import Users from "../../models/user.model";
import Vehicles from "../../models/vehicle.model";
import { vehicleTypes } from "../trip/get-details";
import { sendMessage } from "../../services/requests/index";

const router = Router();

// router.post

router.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !req.user.uid || req.user.account.type !== "coperate") {
    return res.status(401).json({
      status: "error",
      message: "Unauthorized",
    });
  }
  return next();
});

router.post(
  "/add-vehicle",
  async (
    request: Request<
      {},
      {},
      {
        vehicleType: string;
        maker: string;
        model: string;
        year: string;
        color: string;
        plateNumber: string;
        licenseNumber: string;
        name: string;
      }
    >,
    response: Response
  ) => {
    try {
      const user = await Users.findOne({
        _id: request.user._id,
        "account.type": "coperate",
      });

      if (!user) {
        return response.status(400).send({
          status: "error",
          message: "User not found",
        });
      }

      if (
        !user.isEmailVerified ||
        !user.isPhoneVerified ||
        user.isVerifed ||
        !user.isDriverTypeSelected ||
        !user.isIdentityVerified
      ) {
        return response.status(400).send({
          status: "error",
          message: "unable to perform request please complete profile",
        });
      }
    } catch (err) {
      console.log("err:", err);
      return response.status(500).send({
        status: "error",
        message: "unable to complete request",
      });
    }
    const {
      vehicleType,
      maker,
      model,
      year,
      color,
      plateNumber,
      licenseNumber,
      name,
    } = request.body;

    if (
      !vehicleType ||
      !year ||
      !color ||
      !maker ||
      !model ||
      !plateNumber ||
      !name ||
      !licenseNumber
    ) {
      return response.status(400).send({
        status: "error",
        message: "All fields are required",
      });
    }

    if (!vehicleTypes.includes(vehicleType)) {
      return response.status(400).send({
        status: "error",
        message: "Invalid vehicle type",
      });
    }

    //validate year
    if (year.length !== 4) {
      return response.status(400).send({
        status: "error",
        message: "Invalid year",
      });
    }

    if (isNaN(Number(year))) {
      return response.status(400).send({
        status: "error",
        message: "Invalid year",
      });
    }

    if (!validateColor(color)) {
      return response.status(400).send({
        status: "error",
        message: "Invalid color",
      });
    }

    const vehicle = new Vehicles({
      id: v4(),
      name,
      maker,
      model,
      year,
      color,
      plateNumber,
      owner: request.user._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      isApproved: false,
      images: [],
    });

    try {
      const vehicleDetails = await vehicle.save();
      if (!vehicleDetails) {
        return response.status(500).send({
          status: "error",
          message: "Unable to save vehicle",
        });
      } else {
        return response.status(200).send({
          status: "success",
          message: "Vehicle details saved successfully waiting for approval",
        });
      }
    } catch (e) {
      console.log("e:", e);
      return response.status(500).send({
        status: "error",
        message: "Unable to save vehicle",
      });
    }
  }
);
router.post(
  "/driver/add",
  async (
    req: Request<
      {},
      {},
      {
        firstname: string;
        lastname: string;
        phoneNumber: string;
        country: string;
      }
    >,
    res: Response
  ) => {
    try {
      let { firstname, lastname, phoneNumber, country } = req.body;

      if (!firstname || !lastname || !phoneNumber || !country) {
        return res.status(400).send({
          status: "error",
          message: "All fields are required",
        });
      }

      if (!isValidName(firstname) || !isValidName(lastname)) {
        return res.status(400).send({
          status: "error",
          message: "Invalid name",
        });
      }

      if (!isValidCountry(country)) {
        return res.status(400).send({
          status: "error",
          message: "Invalid country",
        });
      }

      let newNumber = phoneNumber;
      const phone = new Phone();
      if (phoneNumber[0] !== "+") {
        newNumber = `+${phoneNumber}`;
      }

      if (!phone.isValid(newNumber)) {
        return res.status(400).send({
          status: "error",
          message: "Invalid phone number",
        });
      }

      const internationalNumber = phone.getInternationNumber(newNumber);
      if (!internationalNumber) {
        return res.status(400).send({
          status: "error",
          message: "Invalid phone number",
        });
      }

      const find = await Users.findOne({
        phoneNumber: internationalNumber,
        $or: [
          {
            "account.type": "regular-driver",
          },
          {
            "account.type": "coperate",
          },
          {
            "account.type": "coperate-owned-driver",
          },
        ],
      });
      if (find) {
        return res.status(400).send({
          status: "error",
          message: "Phone number already used by another user",
        });
      }

      const countryDetails = getCountryDetails(country);

      console.log("countryDetails:", countryDetails);

      const newUser = new Users({
        firstname,
        lastname,
        phoneNumber: internationalNumber,
        country: {
          name: countryDetails.name,
          code: countryDetails.alpha2,
        },
        account: {
          type: "coperate-owned-driver",
          controlledBy: req?.user?._id,
        },
        isDriverTypeSelected: true,
        location: {
          type: "Point",
          coordinates: [0, 0],
        },
        uid: v4(),
        key: encodeString(v4()),
      });

      const user = await newUser.save();
      if (!user) {
        return res.status(500).send({
          status: "error",
          message: "Unable to save user",
        });
      }

      // send sms to user
      const message = `Welcome to our app! You have been added as a driver for our organization.\n\nPlease download our app and complete the verification process to start riding with us.\n\nDownload link: https://www.example.com/app`;

      const datar = await sendMessage(internationalNumber, message);

      console.log("datar:", datar);

      return res.status(200).send({
        status: "success",
        message: "Driver added successfully",
      });
    } catch (err) {
      console.log("err:", err);
      return res.status(500).send({
        status: "error",
        message: "unable to complete request",
      });
    }
  }
);
router.post("/driver/:id/trips", async (req: Request, res: Response) => {});
router.post("/trips", async (req: Request, res: Response) => {});
router.post("/driver/:id/payments", async (req: Request, res: Response) => {});
router.post("/payments", async (req: Request, res: Response) => {});

router.post(
  "/assign-driver-to-vehicle",
  async (req: Request, res: Response) => {}
);

router.post(
  "/unassign-driver-from-vehicle",
  async (req: Request, res: Response) => {}
);

router.post("/remove-driver", async (req: Request, res: Response) => {});

router.post("/upload-document", async (req: Request, res: Response) => {});

// router.post

export default router;
