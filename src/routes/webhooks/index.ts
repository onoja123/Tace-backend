import express, { Router, Request, Response } from "express";
import * as crypto from "crypto";
import Users from "../../models/user.model";
import Transactions from "../../models/transaction.model";

const router: Router = Router();

const paystackWebhookSecretKey = process.env.PAYSTACK_SECRET_KEY as string;

router.post(
  "/paystack",
  express.json({ type: "application/json" }),
  async (req: Request, res: Response) => {
    // check if request.body is empty
    if (Object.keys(req.body).length === 0) {
      return res.status(400).send("Bad Request");
    }
    if (!req.body.event) {
      return res.status(400).send("Bad Request");
    }
    const event = req.body.event;
    if (event === "charge.success") {
      // Retrieve the Paystack signature and body from the request
      const paystackSignature = req.headers["x-paystack-signature"];
      const paystackBody = JSON.stringify(req.body);

      // Compute the expected signature using your Paystack webhook secret key
      const hmac = crypto.createHmac("sha512", paystackWebhookSecretKey);
      hmac.update(paystackBody);
      const expectedSignature = hmac.digest("hex");

      // Compare the expected signature to the actual signature from Paystack
      if (paystackSignature === expectedSignature) {
        // The webhook request is valid, so process it here
        const { amount, id, metadata, status, reference } = req.body.data;
        const { _id, phoneNumber } = metadata;
        // User
        try {
          const user = await Users.findOne({
            $and: [
              { _id },
              { phoneNumber },
              { "account.type": "regular-user" },
            ],
          });
          if (!user) {
            return res.status(400).send("Bad Request");
          }
          // Update user
          await Users.updateOne(
            {
              $and: [
                { _id },
                { phoneNumber },
                { "account.type": "regular-user" },
              ],
            },
            {
              $set: {
                walletBalance: user.walletBalance + amount / 100,
              },
            }
          );

          // create transaction
          const transaction = new Transactions({
            user: _id,
            amount: amount / 100,
            transactionType: "deposit",
            status: "success",
            createdAt: new Date(),
            depositDetails: {
              transactionId: id,
              transactionStatus: status,
              transactionAmount: amount / 100,
              transactionDate: new Date(),
              transactionReference: reference,
              transactionCurrency: req.body.data.currency,
              provider: "paystack",
            },
          });

          await transaction.save();
        } catch (e) {
          console.log(e);
          return res.status(500).send("server error");
        }
        // Return a 200 OK response to Paystack
        console.log(`pament successful for ${_id} with ${amount / 100}`);

        res.status(200).send("OK");
      } else {
        // The webhook request is invalid, so ignore it
        console.warn("Paystack webhook request is invalid:", req.body);

        // Return a 400 Bad Request response to Paystack
        res.status(400).send("Bad Request");
      }
    }
  }
);

// router.get("/orchestrate", (request, res) => {});

export default router;
