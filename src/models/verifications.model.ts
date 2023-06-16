import { Schema, model, Document } from "mongoose";

export interface IVerification extends Document {
  user: Schema.Types.ObjectId;
  vehicleDetails: {
    vehicleType: string;
    vehicleNumber: string;
    vehicleColor: string;
  };
  driversImage: string;
  driverLicense: {
    licenseNumber: string;
    licenseExpiry: Date;
    licenseImage: string;
  };
  documents: Array<{
    documentName: string;
    documentImage: string;
  }>;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
