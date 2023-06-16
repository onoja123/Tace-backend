import { config } from "dotenv";
import { Router, Request, Response } from "express";
import { v4 } from "uuid";
import { parse, stringify, toJSON, fromJSON } from "flatted";

import fetch from "node-fetch";

config();

const router: Router = Router();

router.post(
  "/init",
  async (
    req: Request<
      {},
      {},
      {
        amount: number;
      }
    >,
    res: Response
  ) => {
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

    let { amount } = req.body;

    amount = Number(amount);

    if (!amount) {
      return res.status(400).send({
        status: "error",
        message: "Amount is required",
      });
    }

    if (isNaN(amount)) {
      return res.status(400).send({
        status: "error",
        message: "Amount must be a number",
      });
    }

    if (amount < 100) {
      return res.status(400).send({
        status: "error",
        message: "Amount must not be less than 100",
      });
    }

    const params = JSON.stringify({
      email: req.user.email ? req.user.email : v4() + "@mail.com",
      amount: amount * 100,
      metadata: {
        phoneNumber: req.user.phoneNumber,
        _id: req.user._id,
      },
    });

    fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: params,
    })
      .then((response: any) => response.json())
      .then((result: any) => {
        if (result.status !== true) {
          return res.status(500).send({
            status: "error",
            message: "Something went wrong",
          });
        }
        return res.status(200).send({
          status: "success",
          message: "Payment link generated",
          data: {
            link: result?.data?.authorization_url,
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
