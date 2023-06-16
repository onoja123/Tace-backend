import { Schema, model, Document } from "mongoose";
import { vehicleTypes } from "../routes/trip/get-details";

vehicleTypes;
import { v4 } from "uuid";

export interface IUser extends Document {
  firstname: string;
  lastname: string;
  uid: string;
  email: string;
  password: string;
  phoneNumber: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isAllowedToRide: boolean;
  bankDetails: {
    accountnumber: Number;
    bankCode: Number;
  };
  account: {
    type: string;
  };
  country: {
    name: string;
    code: string;
  };
  isOnline: boolean;
  vehicle: string;
  isVerifed: boolean;
  kycStatus: string;
  createdAt: Date;
  isIdentityVerified: boolean;
  otpSendCount: number;
  otpInputCount: number;
  pauseOtpSend: boolean;
  pauseOtpSendUntil: Date;
  pauseOtpInput: boolean;
  pauseOtpInputUntil: Date;
  walletBalance: number;
  isDriverTypeSelected: boolean;
  organizationName: string;
  businessName: string;
  businessEmail: string;
  city: string;
  pin: string;
  avatar: {
    url: string;
    publicId: string;
  };
  defaultAddress: {
    address: string;
    placeId: string;
    lat: number;
    lng: number;
  };
  key: string;
  location: {
    type: string;
    coordinates: number[];
  };
}

enum kycStatus {
  notStarted = "not-started",
  pending = "pending",
  approved = "approved",
  rejected = "rejected",
}

export const accountTypes = [
  "regular-user",
  "regular-driver",
  "coperate",
  "coperate-owned-driver",
];

export const ridersOnlyDriverTypes = [
  "regular-driver",
  "coperate-owned-driver",
];

export const driverOnlyTypes = [
  "regular-driver",
  "coperate-owned-driver",
  "coperate",
];

const User = new Schema<IUser>({
  avatar: new Schema({
    url: {
      type: String,
      default: "",
    },
    publicId: {
      type: String,
      default: "",
    },
  }),
  bankDetails: {
    accountnumber: {
      type: Number,
    },
    bankCode: {
      type: Number,
    },
  },
  isOnline: {
    type: Boolean,
    default: true,
  },
  organizationName: {
    type: String,
    default: "",
  },
  firstname: {
    type: String,
    default: "",
  },
  lastname: {
    type: String,
    default: "",
  },
  pin: {
    type: String,
    default: "",
  },
  businessName: {
    type: String,
  },
  businessEmail: {
    type: String,
  },
  city: {
    type: String,
  },
  isIdentityVerified: {
    type: Boolean,
    default: false,
  },
  uid: {
    type: String,
    required: true,
    default: v4(),
    unique: true,
  },
  country: new Schema({
    name: {
      type: String,
      default: "",
    },
    code: {
      type: String,
      default: "",
    },
  }),
  email: {
    type: String,
  },
  vehicle: {
    type: String,
    default: "",
    enum: vehicleTypes,
  },
  password: {},
  phoneNumber: {
    type: String,
    default: "",
  },
  walletBalance: {
    type: Number,
    default: 0,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isPhoneVerified: {
    type: Boolean,
    default: false,
  },
  isVerifed: {
    type: Boolean,
    default: false,
  },
  account: new Schema({
    type: {
      type: String,
      default: "regular-user",
      enum: accountTypes,
    },
    controlledBy: {
      type: Schema.Types.ObjectId,
      ref: "Users",
      default: null,
    },
  }),
  kycStatus: {
    type: String,
    enum: Object.values(kycStatus),
    default: kycStatus.notStarted,
  },
  isDriverTypeSelected: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  otpSendCount: {
    type: Number,
    default: 0,
  },
  otpInputCount: {
    type: Number,
    default: 0,
  },
  pauseOtpSend: {
    type: Boolean,
    default: false,
  },
  pauseOtpSendUntil: {
    type: Date,
    default: null,
  },
  pauseOtpInput: {
    type: Boolean,
    default: false,
  },
  pauseOtpInputUntil: {
    type: Date,
    default: null,
  },
  isAllowedToRide: {
    type: Boolean,
    default: false,
  },
  defaultAddress: new Schema({
    address: {
      type: String,
      default: "",
    },
    placeId: {
      type: String,
      default: "",
    },
    lat: {
      type: Number,
      default: 0,
    },
    lng: {
      type: Number,
      default: 0,
    },
  }),
  key: {
    type: String,
    default: v4(),
  },
  location: {
    type: {
      type: String,
      default: "Point",
    },
    coordinates: {
      type: [Number],
      default: [],
    },
  },
});

User.index({ location: "2dsphere" });

export default model<IUser>("Users", User);
