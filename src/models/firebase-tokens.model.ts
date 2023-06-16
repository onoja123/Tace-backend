import { Schema, model, Document } from "mongoose";

export interface FCMTokens extends Document {
  token: string;
  user: Schema.Types.ObjectId;
}

const otpSchema = new Schema<FCMTokens>({
  token: {
    type: String,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "Users",
    default: null,
  },
});

export default model<FCMTokens>("FCMToken", otpSchema);
