import { Request, Router, Response, NextFunction } from "express";
import Users from "../../models/user.model";
import Trips from "../../models/trip.model";
import { fetchDataDOJAH } from "../../services/verification";
import Phone from "../../helpers/lib-phone";
import fcm from "../../controllers/firebase/fcm";
import FCMTokens from "../../models/firebase-tokens.model";

const router: Router = Router();

// router.use("/", (request: Request, response: Response, next: NextFunction) => {
//   if (!request.user || !request.user.uid) {
//     return response.status(401).send({
//       status: "error",
//       message: "Unauthorized",
//       data: null,
//     });
//   }
//   next();
// });

// router.get("/history", async (req: Request, res: Response) => {
//   // Add Detail you want to return My bad
//   const userTrips = await Trips.find({ driver: req.user.uid }).selected();

//   return res.status(200).send({
//     status: "success",
//     message: "Driver Trips Fetched Successfully",
//     data: userTrips,
//   });
// });

// //get ride

// //get ride requests

// //get ride request

// router.get("/profile", async (req: Request, res: Response) => {
//   const userDetails = await Users.findOne({ uid: req.user.uid });

//   if (!userDetails) {
//     return res.status(404).send({
//       status: "error",
//       message: "User not found",
//     });
//   }

//   return res.status(200).send({
//     status: "success",
//     message: "Driver Details Fetched Successfully",
//     data: {
//       firstname: userDetails?.firstname,
//       lastname: userDetails?.lastname,
//       email: userDetails?.email,
//       phoneNumber: userDetails?.phoneNumber,
//       uid: userDetails?.uid,
//       avatar: userDetails?.avatar,
//       isEmailVerified: userDetails?.isEmailVerified,
//       isPhoneNumberVerified: userDetails?.isPhoneVerified,
//     },
//   });
// });

// router.post("/:uid/update-profile", async (req: Request, res: Response) => {
//   if (!req.user || !req.user.uid) {
//     return res.status(401).send({
//       status: "error",
//       message: "Unauthorized",
//     });
//   }

//   if (req.params.uid !== req.user.uid) {
//     return res.status(401).send({
//       status: "error",
//       message: "Unauthorized",
//     });
//   }

//   //TODO: Get Required Fields
//   const updateFields = {
//     firstname: req.body.firstname,
//     lastname: req.body.lastname,
//     email: req.body.email,
//     phoneNumber: req.body.phoneNumber,
//   };

//   const updatedUser = await Users.findOneAndUpdate(
//     { uid: req.user.uid },
//     { $set: updateFields }
//   );

//   if (!updatedUser) {
//     return res.status(404).send({
//       status: "error",
//       message: "User not found",
//     });
//   }
// });

// router.post("/verify", async (req: Request, res: Response) => {
//   let { type, license, nin } = req.body;
//   try {
//     if (!type || type == "") {
//       return res.status(400).send({
//         status: "fail",
//         message: "Type of verification is needed",
//       });
//     }

//     type = type.toLowerCase();
//     let url = "";
//     //TODO: Set to ENV
//     const headers = {
//       Authorization: "Bearer test_sk_lh2IcQYj77ZQKffm4vaob205c",
//       AppId: "63986f81c3a43300361eb24b",
//       "Accept-Encoding": "gzip,deflate,compress",
//     };

//     if (type == "license") {
//       if (license == "" || !license) {
//         return res.status(400).send({
//           status: "fail",
//           message: "License is Required",
//         });
//       }
//       url = `https://sandbox.dojah.io/api/v1/kyc/dl?license_number=${license}`;
//       nin = null;
//     }

//     if (type == "nin") {
//       if (nin == "" || !nin) {
//         return res.status(400).send({
//           status: "fail",
//           message: "NIN is Required",
//         });
//       }
//       url = `https://sandbox.dojah.io/api/v1/kyc/dl?lnin=${nin}`;
//       license = null;
//     }

//     const response = await fetchDataDOJAH(url, headers, "GET", "");

//     if (response.status !== 200) {
//       console.log("Response status ", response.status);
//       res.end();
//     }

//     res.json(response.data);

//     if(response.phone == req.user.phone){
//       const userDetails = await Users.findOne({ uid: req.user.uid });

//       // fcm.sendToMultipleDevices()
//       // get user's fcm token
//       let tokensArray: string[] = [];

//       try {
//         const tokens = await FCMTokens.find({
//           user: req.user._id,
//         });

//         if (tokens && tokens.length > 0) {
//           tokensArray = tokens.map((token) => token.token);
//         } else {
//           console.log(`Error sending notification to user`);
//         }
//       } catch (err) {
//         console.log(`Error sending notification to user: ${err}`);
//       }

//       const payload = {
//         title: "Account Has Been verifed",
//         body: `Your Account Has been Verifed ${req.user.firstname}`,
//       };
//       fcm.sendToMultipleDevices(tokensArray, payload.title, payload.body);

//    }

//   } catch (error) {
//     return res.status(500).send({
//       status: "failed",
//       message: "Server Error Try Again, Unable to Connect to Dojah API",
//     });
//   }
// });

export default router;
