import { Schema, model, Document } from "mongoose";
import { v4 } from "uuid";

export interface ITrip extends Document {
  id: string;
  // type: string;
  sender: {
    fullName?: string;
    // AD?: string;
    id?: Schema.Types.ObjectId;
    phoneNumber?: string;
  };
  vehicleType: string;
  tripType: string;
  receiver: {
    fullName?: string;
    phoneNumber?: string;
    email?: string;
    id?: Schema.Types.ObjectId;
  };
  dropoffCode: {
    code: string;
    qr: string;
  };
  pickupCode: {
    code: string;
    qr: string;
  };
  status: string;
  createdAt: Date;
  updatedAt: Date;
  charge: number;
  completedAt: Date;
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
    placeId: string;
    country: string;
    state: string;
  };
  dropoffLocation: {
    lat: number;
    lng: number;
    address: string;
    placeId: string;
    country: string;
    state: string;
  };

  driver: Schema.Types.ObjectId;
  categories: string[];
}

// export const tripTypes = ["pickup", "dropoff"];
export const tripTypes = ["intraState"];

export const tripStatus = ["pending", "accepted", "completed", "cancelled"];

const tripSchema = new Schema<ITrip>({
  id: {
    type: String,
    required: true,
  },
  sender: new Schema({
    fullName: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    id: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
  }),
  receiver: new Schema({
    fullName: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    email: {
      type: String,
    },
    id: {
      type: Schema.Types.ObjectId,
      ref: "Users",
    },
  }),
  pickupLocation: new Schema({
    lat: {
      type: Number,
    },
    lng: {
      type: Number,
    },
    address: {
      type: String,
    },
    placeId: {
      type: String,
    },
  }),
  dropoffLocation: {
    lat: {
      type: Number,
    },
    lng: {
      type: Number,
    },
    address: {
      type: String,
    },
    placeId: {
      type: String,
    },
  },
  categories: {
    type: [String],
  },
  vehicleType: {
    type: String,
  },
  tripType: {
    type: String,
  },
  status: {
    type: String,
    required: true,
    default: "draft",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  dropoffCode: {
    type: Object,
    // required: true,
  },
  pickupCode: {
    type: Object,
    // required: true,
  },
  charge: {
    type: Number,
    // required: true,
  },
  completedAt: {
    type: Date,
  },
  driver: {
    type: Schema.Types.ObjectId,
    ref: "Users",
    default: null,
  },
});

export default model<ITrip>("Trips", tripSchema);
