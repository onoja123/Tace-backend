import { Router, Request, Response, NextFunction } from "express";
import User from "../../../controllers/user/user.controller";
import {
  comparePasswords,
  decodeString,
  encodeString,
  generateOtp,
  getFutureTimeWithMinutes,
  hashString,
  signJWT,
} from "../../../helpers";
import Phone from "../../../helpers/lib-phone";
import Users from "../../../models/user.model";
import Otps from "../../../models/otp.model";
import { v4 } from "uuid";

const router: Router = Router();

router.use("/", (request: Request, response: Response, next: NextFunction) => {
  if (request?.user?.uid) {
    return response.status(400).send({
      status: "error",
      message: "You are already logged in",
      data: null,
    });
  }
  next();
});

router.post(
  "/get",
  async (
    request: Request<
      {},
      {},
      {
        phoneNumber: string;
      }
    >,
    response: Response
  ) => {
    const { phoneNumber } = request.body;
    let newNumber = phoneNumber;

    if (!phoneNumber) {
      return response.status(401).send({
        status: "error",
        message: "Phone number is required",
      });
    }
    const phone = new Phone();
    if (phoneNumber[0] !== "+") {
      newNumber = `+${phoneNumber}`;
    }
    if (!phone.isValid(newNumber)) {
      return response.status(400).send({
        status: "error",
        message: "Invalid phone number",
        data: null,
      });
    }

    const internationalNumber = phone.getInternationNumber(newNumber);
    if (!internationalNumber) {
      return response.status(400).send({
        status: "error",
        message: "Invalid phone number",
        data: null,
      });
    }

    const createAndSendOtp: any = async (user: any) => {
      //   const otp = generateOtp(6);
      //   const hashedOtp = hashString(otp);

      // using 123456 as otp for test
      const otp = "123456";
      const hashedOtp = hashString(otp);

      const Otp = new Otps({
        otp: hashedOtp,
        user: user._id,
        createdAt: new Date(),
        type: "globalSigninSignup",
        expiresAt: getFutureTimeWithMinutes(10),
      });

      await Otp.save();

      //send sms here when done!

      //
    };
    // search for user with the number in the db
    let potentialUser = await Users.findOne({
      phoneNumber: internationalNumber,
      "account.type": "regular-user",
    });

    if (!potentialUser) {
      const user = new User();
      const newUser = await user.createUser({
        phoneNumber: internationalNumber,
        account: {
          type: "regular-user",
        },
      });

      //   const otp = generateOtp(6);
      //   const hashedOtp = hashString(otp);

      // using 123456 as code for test
      const otp = "123456";
      const hashedOtp = hashString(otp);

      const Otp = new Otps({
        otp: hashedOtp,
        user: newUser._id,
        createdAt: new Date(),
        type: "globalSigninSignup",
        expiresAt: getFutureTimeWithMinutes(10),
      });

      await Otp.save();

      //send sms here when done!

      //

      return response.status(200).send({
        status: "success",
        message: "Otp sent!",
      });
    }

    await Otps.deleteMany({
      phoneNumber: internationalNumber,
      type: "globalSigninSignup",
    });

    if (potentialUser.pauseOtpSend) {
      if (potentialUser.pauseOtpSendUntil > new Date()) {
        return response.status(429).send({
          status: "error",
          message: "OTP sending is paused",
          data: {
            retryIn: potentialUser.pauseOtpSendUntil,
          },
        });
      } else {
        await Users.updateOne(
          {
            uid: potentialUser.uid,
          },
          {
            $set: {
              pauseOtpSend: false,
              pauseOtpSendUntil: null,
              otpSendCount: 0,
            },
          }
        );
      }
    } else {
      if (potentialUser.otpSendCount >= 9) {
        await Users.updateOne(
          {
            uid: potentialUser.uid,
          },
          {
            $set: {
              pauseOtpSend: true,
              pauseOtpSendUntil: getFutureTimeWithMinutes(5),
            },
          }
        );
      } else {
        await Users.updateOne(
          {
            uid: potentialUser.uid,
          },
          {
            $inc: {
              otpSendCount: 1,
            },
          }
        );
      }
      //   const otp = generateOtp(6);
      //   const hashedOtp = hashString(otp);

      // using 123456 as code for test
      const otp = "123456";
      const hashedOtp = hashString(otp);

      const Otp = new Otps({
        otp: hashedOtp,
        user: potentialUser._id,
        createdAt: new Date(),
        type: "globalSigninSignup",
        expiresAt: getFutureTimeWithMinutes(10),
      });

      await Otp.save();

      //send sms here when done!

      //

      return response.status(200).send({
        status: "success",
        message: "Otp sent!",
      });
    }
  }
);

router.post(
  "/verify",
  async (
    request: Request<
      {},
      {},
      {
        phoneNumber: string;
        otp: string;
      }
    >,
    response: Response
  ) => {
    // if(!ph)
    const { phoneNumber, otp } = request.body;
    let newNumber = phoneNumber;

    if (!phoneNumber || !otp) {
      return response.status(400).send({
        status: "error",
        message: "Otp and phone number is required",
        data: null,
      });
    }

    const phone = new Phone();
    if (phoneNumber[0] !== "+") {
      newNumber = `+${phoneNumber}`;
    }
    if (!phone.isValid(newNumber)) {
      console.log(newNumber);

      return response.status(400).send({
        status: "error",
        message: "Invalid phone number",
        data: null,
      });
    }

    const internationalNumber = phone.getInternationNumber(newNumber);
    if (!internationalNumber) {
      return response.status(400).send({
        status: "error",
        message: "Invalid phone number",
        data: null,
      });
    }

    let userDetails = await Users.findOne({
      phoneNumber: internationalNumber,
      "account.type": "regular-user",
    });

    if (!userDetails) {
      return response.status(404).send({
        status: "error",
        message: "User not found",
      });
    }

    if (userDetails?.pauseOtpInput) {
      if (userDetails?.pauseOtpInputUntil > new Date()) {
        return response.status(429).send({
          status: "error",
          message: "input limit exceeded",
          data: {
            retryIn: userDetails?.pauseOtpInputUntil,
          },
        });
      } else {
        userDetails.pauseOtpInput = false;
        userDetails.pauseOtpInputUntil = new Date();
        userDetails.otpInputCount = 0;
        await userDetails.save();
      }
    }

    const otpDetails = await Otps.findOne({
      user: userDetails._id,
      type: "globalSigninSignup",
    });
    if (
      !otpDetails ||
      !comparePasswords(otp, otpDetails.otp) ||
      otpDetails.expiresAt < new Date()
    ) {
      if (userDetails?.otpInputCount >= 9) {
        userDetails.pauseOtpInput = true;
        userDetails.pauseOtpInputUntil = getFutureTimeWithMinutes(15);
        await userDetails.save();
      } else {
        userDetails.otpInputCount += 1;
        await userDetails.save();
      }

      return response.status(400).send({
        status: "error",
        message: "invalid or expired otp",
        data: null,
      });
    }
    // let key;

    if (!userDetails.isPhoneVerified) {
      userDetails.isPhoneVerified = true;
    }
    if (!userDetails?.key) {
      userDetails.key = encodeString(v4());
    }
    await userDetails.save();

    const jwt = await signJWT(
      {
        uid: userDetails.uid,
      },
      await decodeString(userDetails?.key)
    );

    await Otps.deleteMany({
      user: userDetails._id,
    });
    return response.send({
      status: "success",
      data: {
        accessToken: jwt,
        refreshToken: null,
        userDetails: {
          uid: userDetails.uid,
          phoneNumber: userDetails.phoneNumber,
          isPhoneVerified: userDetails.isPhoneVerified,
          isEmailVerified: userDetails.isEmailVerified,
          isProfileCompleted:
            userDetails.firstname && userDetails.lastname ? true : false,
        },
        accountType: userDetails.account.type,
      },
    });
  }
);

export default router;

/**
 * @openapi
 * /api/v1/auth/user/otp/get:
 *   post:
 *     tags:
 *      - user
 *     description: get login/signup otp for user
 *     requestBody:
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          phoneNumber:
 *           type: string
 *           required: true
 *           example: +2348123456789
 *           description: phone number of user in international format with country code and no spaces or dashes e.g +2348123456789 - (nigerian) or +254712345678 - (kenyan) or +12345678901 - (american)
 *
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *          application/json:
 *           schema:
 *           type: object
 *           properties:
 *            status:
 *             type: string
 *
 *           example:
 *            status: success
 *            message: Otp sent!
 *
 *       429:
 *        description: Too many requests
 *        content:
 *         application/json:
 *          schema:
 *           type: object
 *           properties:
 *            status:
 *             type: string
 *             example: error
 *            message:
 *             type: string
 *             example: Too many requests
 *            data:
 *             type: object
 *             properties:
 *              retryIn:
 *               type: string
 *               example: 2022-12-04T05:31:16.395Z
 *
 *
 *       400:
 *        description: Bad request
 *        content:
 *         application/json:
 *          schema:
 *           type: object
 *           properties:
 *            status:
 *             type: string
 *             example: error
 *            message:
 *             type: string
 *             example:
 *              - Phone number is invalid
 *              - Phone number is required
 *
 *
 *           example:
 *            status: error
 *            message: Phone number is invalid
 *
 *
 *       500:
 *        description: Internal server error
 *
 *
 *
 *
 *
 * /api/v1/auth/user/otp/verify:
 *   post:
 *     tags:
 *      - user
 *     description: verify otp and get access token
 *     requestBody:
 *      content:
 *       application/json:
 *        schema:
 *         type: object
 *         properties:
 *          phoneNumber:
 *           type: string
 *           required: true
 *           example: +2348123456789
 *           description: phone number of user in international format with country code and no spaces or dashes e.g +2348123456789 - (nigerian) or +254712345678 - (kenyan) or +12345678901 - (american)
 *          otp:
 *           type: string
 *           required: true
 *           example: 123456
 *           description: otp sent to user
 *
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *          application/json:
 *           schema:
 *            type: object
 *            properties:
 *             status:
 *              type: string
 *              example: success
 *             data:
 *              type: object
 *              properties:
 *                accessToken:
 *                 type: string
 *                 example: eyJhbGciOi
 *                refreshToken:
 *                 type: string
 *                 example: null
 *
 *       429:
 *        description: Too many requests
 *        content:
 *         application/json:
 *          schema:
 *           type: object
 *           properties:
 *            status:
 *             type: string
 *             example: error
 *            message:
 *             type: string
 *             example: input limit exceeded
 *            data:
 *             type: object
 *             properties:
 *              retryIn:
 *               type: string
 *               example: 2022-12-04T05:31:16.395Z
 *
 *
 *       400:
 *        description: Bad request
 *        content:
 *         application/json:
 *          schema:
 *           type: object
 *           properties:
 *            status:
 *             type: string
 *             example: error
 *            message:
 *             type: string
 *             example:
 *              - Phone number is invalid
 *              - Phone number is required
 *              - invalid or expired otp
 *
 *
 *           example:
 *            status: error
 *            message: Phone number is invalid
 *
 *
 *       500:
 *        description: Internal server error
 *
 */
