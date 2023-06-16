import { Schema, model, Document } from "mongoose";

export interface IVehicle extends Document {
  id: string;
  name: string;
  maker: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  owner: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isApproved: boolean;
  images: Schema.Types.Array;
  isCoperateOwned: boolean;
  asignedTo: Schema.Types.ObjectId;
}

const vehicle = new Schema<IVehicle>({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
  },
  maker: {
    type: String,
  },
  model: {
    type: String,
  },
  year: {
    type: Number,
  },
  color: {
    type: String,
  },
  plateNumber: {
    type: String,
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  images: {
    type: Schema.Types.Array,
  },
  isCoperateOwned: {
    type: Boolean,
    default: false,
  },
  asignedTo: {
    type: Schema.Types.ObjectId,
    ref: "Users",
  },
});

export default model<IVehicle>("Vehicles", vehicle);
