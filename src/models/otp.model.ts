import { Schema, model, Document } from "mongoose";

export interface IOtp extends Document {
  otp: string;
  user: Schema.Types.ObjectId;
  createdAt: Date;
  expiresAt: Date;
  type: string;
}

export const otpTypes = [
  "signupEmail",
  "signupPhone",
  "forgotPassword",
  "verifyPhone",
  "verifyEmail",
  "globalSigninSignup",
];

const otpSchema = new Schema<IOtp>({
  otp: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "Users",
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
});

export default model<IOtp>("Otps", otpSchema);
