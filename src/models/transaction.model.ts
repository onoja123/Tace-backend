import { Schema, model, Document } from "mongoose";

export interface ITransaction extends Document {
  user: Schema.Types.ObjectId;
  amount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  transactionType: string;
  depositDetails: {
    transactionId: string;
    transactionStatus: string;
    transactionAmount: number;
    transactionDate: Date;
    transactionType: string;
    transactionCurrency: string;
    transactionFee: number;
    transactionRef: string;
    transactionRefId: string;
    transactionRefUrl: string;
    transactionRefMethod: string;
    transactionMethod: string;
  };
}

const transaction = new Schema<ITransaction>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  transactionType: {
    type: String,
    required: true,
    default: "deposit",
    enum: ["deposit", "withdrawal"],
  },
  status: {
    type: String,
    required: true,
    default: null,
    enum: ["pending", "success", "failed"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  depositDetails: new Schema({
    transactionId: {
      type: String,
    },
    transactionStatus: {
      type: String,
    },
    transactionAmount: {
      type: Number,
    },
    transactionDate: {
      type: Date,
    },
    transactionType: {
      type: String,
    },
    transactionCurrency: {
      type: String,
    },
    provider: {
      type: String,
    },
  }),
});

export default model<ITransaction>("Transactions", transaction);
