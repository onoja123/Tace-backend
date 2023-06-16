import { Request, Router, Response, application, NextFunction } from "express";
import Users from "../../models/user.model";
import Trips, { tripStatus } from "../../models/trip.model";

import cloudinary from "../../controllers/uploads/cloudinary/index";
import { multerConfigImg } from "../../controllers/uploads/multer";
import { comparePasswords, hashString, isValidName } from "../../helpers";
import isEmail from "validator/lib/isEmail";
import Phone from "../../helpers/lib-phone";
import googleMap from "../../services/google-map";
import Transactions from "../../models/transaction.model";

const router: Router = Router();

router.use("/", (request: Request, response: Response, next: NextFunction) => {
  if (
    !request.user ||
    !request.user.uid ||
    request.user.account.type !== "regular-user"
  ) {
    return response.status(401).send({
      status: "error",
      message: "Unauthorized",
      data: null,
    });
  }
  next();
});

router.get(
  "/get-trips",
  async (
    req: Request<
      {},
      {},
      {
        page?: string;
        limit?: string;
        status?: string;
      }
    >,
    res: Response
  ) => {
    let { page, limit, status } = req.query;

    const tripStatus = [
      "draft",
      "pending",
      "accepted",
      "completed",
      "cancelled",
    ];

    // tripStatus
    // if (!status || !tripStatus.includes(status))
    if (status && typeof status === "string") {
      if (!tripStatus.includes(status)) {
        status = "";
      }
    }

    if (!page) {
      page = "1";
    }
    if (!limit) {
      limit = "20";
    }

    let trips = [];
    let totalTrips = 0;

    if (status) {
      try {
        // check if status is valid
        trips = await Trips.find({
          "sender.id": req.user._id,
          status,
        })
          .sort({ createdAt: -1 })
          .skip((Number(page) - 1) * Number(limit))
          .limit(Number(limit))
          .populate("driver", "firstname lastname avatar");

        totalTrips = await Trips.countDocuments({
          "sender.id": req.user._id,
          status,
        });
      } catch (err) {
        return res.status(500).send({
          status: "error",
          message: "Unable to process request",
        });
      }
    } else {
      try {
        trips = await Trips.find({
          "sender.id": req.user._id,
        })
          .sort({ createdAt: -1 })
          .skip((Number(page) - 1) * Number(limit))
          .limit(Number(limit))
          .populate("driver", "firstname lastname avatar");

        totalTrips = await Trips.countDocuments({
          "sender.id": req.user._id,
        });
      } catch (err) {
        return res.status(500).send({
          status: "error",
          message: "Unable to process request",
        });
      }
    }
    console.log("hehrer");

    return res.status(200).send({
      status: "success",
      message: "Trips fetched successfully",
      data: {
        trips,
        totalTrips,
        currentPage: Number(page),
        totalPages: Math.ceil(totalTrips / Number(limit)),
      },
    });
  }
);

router.get(
  "/get-profile",
  async (
    req: Request<{
      uid: string;
    }>,
    res: Response
  ) => {
    if (!req.user || !req.user.uid) {
      return res.status(401).send({
        status: "error",
        message: "Unauthorized",
      });
    }

    // if (req.params.uid !== req.user.uid) {
    //   return res.status(401).send({
    //     status: "error",
    //     message: "Unauthorized",
    //   });
    // }
    const userDetails = await Users.findOne({ uid: req.user.uid });

    if (!userDetails) {
      return res.status(404).send({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(200).send({
      status: "success",
      message: "User details fetched successfully",
      data: {
        firstname: userDetails?.firstname,
        lastname: userDetails?.lastname,
        email: userDetails?.email,
        phoneNumber: userDetails?.phoneNumber,
        uid: userDetails?.uid,
        avatar: userDetails?.avatar?.url,
        isEmailVerified: userDetails?.isEmailVerified,
        isPhoneNumberVerified: userDetails?.isPhoneVerified,
        isProfileCompleted:
          userDetails.firstname && userDetails.lastname ? true : false,
        walletBalance: userDetails?.walletBalance,
        address: userDetails?.defaultAddress,
      },
    });
  }
);
router.get(
  "/:uid/get-profile",
  async (
    req: Request<{
      uid: string;
    }>,
    res: Response
  ) => {
    if (!req.user || !req.user.uid) {
      return res.status(401).send({
        status: "error",
        message: "Unauthorized",
      });
    }

    if (req.params.uid !== req.user.uid) {
      return res.status(401).send({
        status: "error",
        message: "Unauthorized",
      });
    }
    const userDetails = await Users.findOne({ uid: req.user.uid });

    if (!userDetails) {
      return res.status(404).send({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(200).send({
      status: "success",
      message: "User details fetched successfully",
      data: {
        firstname: userDetails?.firstname,
        lastname: userDetails?.lastname,
        email: userDetails?.email,
        phoneNumber: userDetails?.phoneNumber,
        uid: userDetails?.uid,
        avatar: userDetails?.avatar.url,
        isEmailVerified: userDetails?.isEmailVerified,
        isPhoneNumberVerified: userDetails?.isPhoneVerified,
        isProfileCompleted:
          userDetails.firstname && userDetails.lastname ? true : false,
        walletBalance: userDetails?.walletBalance,
        address: userDetails?.defaultAddress,
      },
    });
  }
);

router.post(
  "/:uid/update-profile",
  async (
    req: Request<
      {
        uid: string;
      },
      {},
      {
        firstname?: string;
        lastname?: string;
        email?: string;
        phoneNumber?: string;
        address?: string;
      }
    >,
    res: Response
  ) => {
    console.log("here sha");

    if (!req.user || !req.user.uid) {
      console.log("here sha", `!req.user || !req.user.uid`);

      return res.status(401).send({
        status: "error",
        message: "Unauthorized",
      });
    }

    if (req.params.uid !== req.user.uid) {
      console.log(
        "here sha",
        `req.params.uid !== req.user.uid`,
        req.params.uid,
        req.user.uid
      );
      return res.status(401).send({
        status: "error",
        message: "Unauthorized",
      });
    }

    // const { firstname, lastname, email, phoneNumber } = req.body;

    //update individual fields
    const userDetails = await Users.findOne({ uid: req.user.uid });

    if (!userDetails) {
      return res.status(404).send({
        status: "error",
        message: "User not found",
      });
    }

    // if (req.body.firstname) {
    //   userDetails.firstname = req.body.firstname;
    // }
    const updateFields: any = {};
    // update every item in the request body

    // const firstname = req?.body?.firstname;
    if (req?.body?.firstname) {
      if (!isValidName(req.body.firstname)) {
        return res.status(400).send({
          status: "error",
          message: "Invalid firstname",
        });
      } else {
        updateFields["firstname"] = req.body.firstname;
      }
      // userDetails.firstname = req.body.firstname;
    }

    if (req?.body?.lastname) {
      if (!isValidName(req.body.lastname)) {
        return res.status(400).send({
          status: "error",
          message: "Invalid lastname",
        });
      } else {
        updateFields["lastname"] = req.body.lastname;
      }
    }

    if (req?.body?.email) {
      if (!isEmail(req.body.email)) {
        return res.status(400).send({
          status: "error",
          message: "Invalid email",
        });
      } else {
        const find = await Users.findOne({ email: req.body.email });
        if (find && find.uid !== req.user.uid) {
          return res.status(400).send({
            status: "error",
            message: "Email already used by user",
          });
        }
        updateFields["email"] = req.body.email;
        updateFields["isEmailVerified"] = false;
      }
    }

    if (req?.body?.phoneNumber) {
      let newNumber = req?.body?.phoneNumber;
      const phone = new Phone();
      if (req?.body?.phoneNumber[0] !== "+") {
        newNumber = `+${req?.body?.phoneNumber}`;
      }
      if (!phone.isValid(newNumber)) {
        return res.status(400).send({
          status: "error",
          message: "Invalid phone number",
          data: null,
        });
      }

      const internationalNumber = phone.getInternationNumber(newNumber);
      if (!internationalNumber) {
        return res.status(400).send({
          status: "error",
          message: "Invalid phone number",
          data: null,
        });
      }
      const find = await Users.findOne({ phoneNumber: internationalNumber });
      if (find && find.uid !== req.user.uid) {
        return res.status(400).send({
          status: "error",
          message: "Phone number already used by another user",
        });
      }
      if (!find) {
        updateFields["phoneNumber"] = internationalNumber;
        updateFields["isPhoneVerified"] = false;
      }
    }

    if (req?.body?.address) {
      // placeid details
      try {
        const { data } = await googleMap.getPlaceDetails(req?.body?.address);
        if (data.status === "OK") {
          // get the full address, lat, lng
          const address = data.results[0].formatted_address;
          const lat = data.results[0].geometry.location.lat;
          const lng = data.results[0].geometry.location.lng;
          updateFields["defaultAddress"] = {
            placeId: req?.body?.address,
            address,
            lat,
            lng,
          };
        }
      } catch (err) {
        console.log("err:", err);
      }
      // googleMap
      //   .getPlaceDetails(req?.body?.address)
      //   .then((result) => {
      //     // get the full address, lat, lng
      //     const address = result.data.results[0].formatted_address;
      //     const lat = result.data.results[0].geometry.location.lat;
      //     const lng = result.data.results[0].geometry.location.lng;
      //     updateFields["address"] = {
      //       placeId: req?.body?.address,
      //       address,
      //       lat,
      //       lng,
      //     };
      //     console.log("result:", result.data);
      //   })
      //   .catch((err) => {
      //     console.log(err);
      //   });
    }

    // check if updateFields is empty
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).send({
        status: "error",
        message: "No fields to update",
      });
    }

    try {
      const updatedUser = await Users.findOneAndUpdate(
        { uid: req.user.uid },
        { $set: updateFields },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(404).send({
          status: "error",
          message: "User not found",
        });
      } else {
        return res.status(200).send({
          status: "success",
          message: "User details updated successfully",
          data: {
            firstname: updatedUser?.firstname,
            lastname: updatedUser?.lastname,
            email: updatedUser?.email,
            phoneNumber: updatedUser?.phoneNumber,
            uid: updatedUser?.uid,
            avatar: updatedUser?.avatar?.url,
            isEmailVerified: updatedUser?.isEmailVerified,
            isPhoneNumberVerified: updatedUser?.isPhoneVerified,
            walletBalance: userDetails?.walletBalance,
          },
        });
      }
    } catch (err) {
      console.log(err);
      return res.status(500).send({
        status: "error",
        message: "Unable to process request",
      });
    }

    // const updateFields = {
    //   firstname: req.body.firstname,
    //   lastname: req.body.lastname,
    //   email: req.body.email,
    //   phoneNumber: req.body.phoneNumber,
    // };

    // const updatedUser = await Users.findOneAndUpdate(
    //   { uid: req.user.uid },
    //   { $set: updateFields }
    // );

    // if (!updatedUser) {
    //   return res.status(404).send({
    //     status: "error",
    //     message: "User not found",
    //   });
    // }
  }
);

router.post(
  "/:uid/upload-avatar",
  multerConfigImg.single("file") as any,
  async (req: Request, res: Response) => {
    const file: Array<Express.Multer.File> | any = req.file;

    if (!file) {
      return res.status(400).json({
        status: "error",
        message: "No file uploaded",
      });
    }

    // make sure file size is not greater than 20mb
    if (file.size > 20 * 1024 * 1024) {
      return res.status(400).json({
        status: "error",
        message: "File size must not be greater than 20mb",
      });
    }

    const user = await Users.findOne({ uid: req.user.uid });
    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    const extraConfig = user.avatar.publicId
      ? { public_id: user.avatar.publicId, overwrite: true }
      : { folder: "/images/avatars" };

    // upload image
    try {
      const result: any = await cloudinary.upload(file, true, {
        upload_preset: "200x200-resize",
        ...extraConfig,
      });

      // update user avatar
      await Users.findOneAndUpdate(
        { uid: req.user.uid },
        {
          $set: {
            avatar: {
              url: result.url,
              publicId: result.publicId,
            },
          },
        }
      );

      return res.status(200).json({
        status: "success",
        message: "Image uploaded successfully",
        data: {
          url: result.url,
          publicId: result.publicId,
        },
      });

      // const updateFields = {
    } catch (err) {
      return res.status(500).json({
        status: "error",
        message: "Error uploading image",
      });
    }
  }
);

router.post(
  "/create-pin",
  async (
    req: Request<
      {},
      {},
      {
        pin: string;
      }
    >,
    res: Response
  ) => {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        status: "error",
        message: "Pin is required",
      });
    }
    if (isNaN(Number(pin))) {
      return res.send({
        status: "error",
        message: "Invalid pin",
      });
    }
    if (pin.length !== 4) {
      return res.status(400).json({
        status: "error",
        message: "Pin must be 4 digits",
      });
    }

    const userDetails = await Users.findOne({ uid: req.user.uid });

    if (!userDetails) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    if (userDetails.pin) {
      return res.status(400).json({
        status: "error",
        message: "Pin already exists",
      });
    }

    let hashedPin: string;

    try {
      hashedPin = hashString(pin);
    } catch (err) {
      console.log("err:", err);
      return res.status(400).json({
        status: "error",
        message: "unable to complete request",
      });
    }

    if (!hashedPin) {
      return res.status(400).json({
        status: "error",
        message: "unable to complete request",
      });
    }
    let updatedUser;

    try {
      updatedUser = await Users.findOneAndUpdate(
        { uid: req.user.uid },
        { $set: { pin: hashedPin } }
      );
    } catch (err) {
      console.log("err:", err);
      return res.status(400).json({
        status: "error",
        message: "unable to complete request",
      });
    }

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Pin created successfully",
    });

    // hash thr pin

    // Users.findOneAndUpdate(
    //   { uid: req.user.uid },
    //   { $set: { pin } },
    //   { new: true }
    // )
    //   .then((user) => {
    //     if (!user) {
    //       return res.status(404).json({
    //         status: "error",
    //         message: "User not found",
    //       });
    //     }

    //     return res.status(200).json({
    //       status: "success",
    //       message: "Pin created successfully",
    //     });
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //     return res.status(500).json({
    //       status: "error",
    //       message: "Unable to process request",
    //     });
    //   });
  }
);

router.post(
  "/verify-pin",
  async (req: Request<{}, {}, { pin: string }>, res: Response) => {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        status: "error",
        message: "Pin is required",
      });
    }

    if (isNaN(Number(pin))) {
      return res.status(400).json({
        status: "error",
        message: "Invalid pin",
      });
    }

    if (pin.length !== 4) {
      return res.status(400).json({
        status: "error",
        message: "Invalid pin",
      });
    }

    const userDetails = await Users.findOne({ uid: req.user.uid });

    if (!userDetails) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    if (!userDetails.pin) {
      return res.status(400).json({
        status: "error",
        message: "Pin does not exist",
      });
    }

    let comparedPin: boolean;

    try {
      comparedPin = comparePasswords(pin, userDetails.pin);
    } catch (err) {
      console.log("err:", err);
      return res.status(400).json({
        status: "error",
        message: "unable to complete request",
      });
    }

    if (!comparedPin) {
      return res.status(400).json({
        status: "error",
        message: "Invalid pin",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Pin verified successfully",
    });
  }
);

router.post(
  "/update-pin",
  async (
    req: Request<
      {},
      {},
      {
        pin: string;
        newPin: string;
      }
    >,
    res: Response
  ) => {
    const { pin, newPin } = req.body;

    if (!pin || !newPin) {
      return res.status(400).json({
        status: "error",
        message: "Old Pin and new pin are required",
      });
    }

    if (isNaN(Number(pin)) || isNaN(Number(newPin))) {
      return res.status(400).json({
        status: "error",
        message: "Invalid pin",
      });
    }

    if (pin.length !== 4 || newPin.length !== 4) {
      return res.status(400).json({
        status: "error",
        message: "Invalid pin",
      });
    }

    const userDetails = await Users.findOne({ uid: req.user.uid });

    if (!userDetails) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    if (!userDetails.pin) {
      return res.status(400).json({
        status: "error",
        message: "Pin does not exist",
      });
    }

    let comparedPin: boolean;

    try {
      comparedPin = comparePasswords(pin, userDetails.pin);
    } catch (err) {
      console.log("err:", err);
      return res.status(400).json({
        status: "error",
        message: "unable to complete request",
      });
    }

    if (!comparedPin) {
      return res.status(400).json({
        status: "error",
        message: "Invalid pin",
      });
    }

    let hashedPin: string;

    try {
      hashedPin = hashString(newPin);
    } catch (err) {
      console.log("err:", err);
      return res.status(400).json({
        status: "error",
        message: "unable to complete request",
      });
    }

    if (!hashedPin) {
      return res.status(400).json({
        status: "error",
        message: "unable to complete request",
      });
    }

    let updatedUser;

    try {
      updatedUser = await Users.findOneAndUpdate(
        { uid: req.user.uid },
        { $set: { pin: hashedPin } }
      );
    } catch (err) {
      console.log("err:", err);
      return res.status(400).json({
        status: "error",
        message: "unable to complete request",
      });
    }

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Pin updated successfully",
    });
  }
);

router.get("/transactions", async (req: Request, res: Response) => {
  const { page = 1, limit = 10 } = req.query;

  if (isNaN(Number(page)) || isNaN(Number(limit))) {
    return res.status(400).json({
      status: "error",
      message: "Invalid query parameters",
    });
  }

  const skip = (Number(page) - 1) * Number(limit);
  try {
    const transactionCount = await Transactions.countDocuments({
      user: req.user._id,
    });
    const transactions = await Transactions.find({ user: req.user._id })
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    if (!transactions) {
      return res.status(404).json({
        status: "error",
        message: "Transactions not found",
      });
    } else {
      const demoTransactions = [
        {
          amount: 1000,
          type: "Deposit",
          createdAt: "2021-05-01T12:00:00.000Z",
          reference: "1234567890",
          status: "success",
          balance: 1000,
        },
        {
          amount: 200,
          type: "Order Payment",
          createdAt: "2021-05-01T12:00:00.000Z",
          reference: "1234567890",
          status: "success",
          balance: 800,
        },
      ];
      return res.status(200).json({
        status: "success",
        message: "Transactions found successfully",
        data: {
          transactions:
            transactions.length > 0 ? transactions : demoTransactions,
          totalTransactions: transactionCount,
          currentPage: Number(page),
          totalPages: Math.ceil(transactionCount / Number(limit)),
        },
      });
    }
  } catch (err) {
    console.log("err:", err);
    return res.status(400).json({
      status: "error",
      message: "unable to complete request",
    });
  }
});
export default router;

// https://staging-api.cargodealerinc.com/socket.io/
