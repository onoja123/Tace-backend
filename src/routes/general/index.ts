import { Router, Response, Request } from "express";
import { Admin } from "../../controllers/firebase/fcm";
import axios from "axios";
import authMiddleware from "../../middlewares/auth";
import fetch from "node-fetch";
import FCMTokens from "../../models/firebase-tokens.model";

const router: Router = Router();

router.post(
  "/update-fcm-token",
  authMiddleware() as any,
  async (req: Request<{}, {}, { fcmToken: string }>, res: Response) => {
    if (!req.body.fcmToken) {
      return res.status(400).json({
        status: "error",
        message: "fcm token is required",
        data: null,
      });
    }

    const { _id } = req.user;

    // if(!admin)

    // verify token

    // const token = await FCMTokens.findOneAndUpdate(
    try {
      // find one if token is there and update or create new one
      const decodedToken = await Admin.auth().verifyIdToken(req.body.fcmToken);

      console.log(decodedToken);

      if (!decodedToken) {
        return res.status(400).json({
          status: "error",
          message: "invalid fcm token",
          data: null,
        });
      }

      const token = await FCMTokens.findOneAndUpdate(
        {
          token: req.body.fcmToken,
        },
        {
          token: req.body.fcmToken,
          user: _id,
        },
        {
          upsert: true,
          new: true,
        }
      );

      return res.status(200).json({
        status: "success",
        message: "fcm token updated successfully",
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({
        status: "error",
        message: "error updating fcm token",
        data: null,
      });
    }
  }
);

router.get("/get-banks", async (req: Request, res: Response) => {
  try {
    const response = await axios.get("https://api.paystack.co/bank", {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    // Filter the bank details to get the required fields (bankname, bankcode and bankid)
    const banks = response.data.data.map((bank: any) => ({
      name: bank.name,
      code: bank.code,
      id: bank.id,
    }));

    // Send the filtered bank details as the API response
    res.status(200).send({
      status: "success",
      message: "Banks retrieved",
      banks,
    });
  } catch (error) {
    console.log("error", error);
    return res.status(500).send({
      status: "error",
      message: "Something went wrong",
    });
  }
});

router.post(
  "/resolve-account-number",
  authMiddleware() as any,
  async (req: Request, res: Response) => {
    const { accountNumber, bankCode } = req.body;
    if (!accountNumber || !bankCode) {
      return res.status(400).send({
        status: "error",
        message: "Account number and bank code are required",
      });
    }
    fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    )
      .then((response: any) => response.json())
      .then((result: any) => {
        return res.status(200).send({
          status: "true",
          message: "Account number resolved",
          data: {
            accountNumber: result.data.account_number,
            accountName: result.data.account_name,
          },
        });
      })
      .catch((error: any) => {
        console.log("error", error);
        return res.status(500).send({
          status: "error",
          message: "Something went wrong",
        });
      });
  }
);

export default router;
