import { Schema, model, Document } from "mongoose";

export interface IAdmin extends Document {
  rates: {
    intraState: {
      bikes: {
        baseFare: number;
        perKm: number;
        perMinute: number;
        minimunFare: number;
        perDestination: number;
      };
      car: {
        baseFare: number;
        perKm: number;
        perMinute: number;
        minimunFare: number;
        perDestination: number;
      };
      miniVans: {
        baseFare: number;
        perKm: number;
        perMinute: number;
        minimunFare: number;
        perDestination: number;
      };
      vans: {
        baseFare: number;
        perKm: number;
        perMinute: number;
        minimunFare: number;
        perDestination: number;
      };
      mediumTrucks: {
        baseFare: number;
        perKm: number;
        perMinute: number;
        minimunFare: number;
        perDestination: number;
      };
    };
  };
}

const RatesSchema = new Schema<IAdmin>({
  rates: new Schema({
    intraState: new Schema({
      bike: new Schema({
        baseFare: {
          type: Number,
          required: true,
          default: 100,
        },
        perKm: {
          type: Number,
          required: true,
          default: 40,
        },
        perMinute: {
          type: Number,
          required: true,
          default: 15,
        },
        minimunFare: {
          type: Number,
          required: true,
          default: 500,
        },
        perDestination: {
          type: Number,
          required: true,
          default: 100,
        },
      }),
      car: new Schema({
        baseFare: {
          type: Number,
          required: true,
          default: 300,
        },
        perKm: {
          type: Number,
          required: true,
          default: 60,
        },
        perMinute: {
          type: Number,
          required: true,
          default: 20,
        },
        minimunFare: {
          type: Number,
          required: true,
          default: 700,
        },
        perDestination: {
          type: Number,
          required: true,
          default: 100,
        },
      }),
      miniVan: new Schema({
        baseFare: {
          type: Number,
          required: true,
          default: 400,
        },
        perKm: {
          type: Number,
          required: true,
          default: 75,
        },
        perMinute: {
          type: Number,
          required: true,
          default: 20,
        },
        minimunFare: {
          type: Number,
          required: true,
          default: 800,
        },
        perDestination: {
          type: Number,
          required: true,
          default: 100,
        },
      }),
      van: new Schema({
        baseFare: {
          type: Number,
          required: true,
          default: 600,
        },
        perKm: {
          type: Number,
          required: true,
          default: 100,
        },
        perMinute: {
          type: Number,
          required: true,
          default: 40,
        },
        minimunFare: {
          type: Number,
          required: true,
          default: 1000,
        },
        perDestination: {
          type: Number,
          required: true,
          default: 200,
        },
      }),
      mediumTruck: new Schema({
        baseFare: {
          type: Number,
          required: true,
          default: 1000,
        },
        perKm: {
          type: Number,
          required: true,
          default: 200,
        },
        perMinute: {
          type: Number,
          required: true,
          default: 60,
        },
        minimunFare: {
          type: Number,
          required: true,
          default: 2000,
        },
        perDestination: {
          type: Number,
          required: true,
          default: 500,
        },
      }),
    }),
  }),
});

export default model<IAdmin>("Cargo-Dealer-Admin", RatesSchema);
