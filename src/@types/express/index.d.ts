import { Request } from "express";
import { Schema } from "mongoose";

declare global {
  namespace Express {
    export interface Request {
      user: {
        uid: string;
        email: string;
        account: {
          type: string;
        };
        firstname: string;
        lastname: string;
        phoneNumber: string;
        _id: Schema.Types.ObjectId;
        country: {
          name: string;
          code: string;
        };
        organizationName?: string;
      };
    }
  }
}
