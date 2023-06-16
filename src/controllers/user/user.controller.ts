import user, { IUser } from "../../models/user.model";
import { Error } from "mongoose";
import { encodeString, getFutureTimeWithMinutes } from "../../helpers";
import { v4 } from "uuid";

class User {
  getUserByEmail(email: string): Promise<IUser | Error | undefined> {
    return new Promise((resolve, reject) => {
      user.findOne({ email }, (err: Error, user: IUser) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(user);
        }
      });
      // .select("-password");
    });
  }

  async createUser({
    firstname,
    lastname,
    email,
    password,
    phoneNumber,
    account,
  }: any): Promise<IUser> {
    return new Promise(async (resolve, reject) => {
      try {
        const userDoc: IUser = new user({
          firstname,
          lastname,
          email,
          password,
          phoneNumber,
          account,
          location: {
            type: "Point",
            coordinates: [0, 0],
          },
          uid: v4(),
          key: encodeString(v4()),
        });

        const savedUser = await userDoc.save();
        resolve(savedUser);
      } catch (err) {
        reject(err);
      }
    });
  }

  async pauseOtpSend(uid: string): Promise<IUser | Error | undefined> {
    return new Promise((resolve, reject) => {
      user.findOneAndUpdate(
        { uid },
        {
          $set: {
            pauseOtpSend: true,
            pauseOtpSendUntil: getFutureTimeWithMinutes(15),
          },
        },
        (err: Error, user: IUser) => {
          if (err) {
            reject(err);
          } else {
            resolve(user);
          }
        }
      );
    });
  }

  async incrementOtpResendCount(
    uid: string
  ): Promise<IUser | Error | undefined> {
    return new Promise((resolve, reject) => {
      user.findOneAndUpdate(
        { uid },
        {
          $inc: {
            otpSendCount: 1,
          },
        },
        (err: Error, user: IUser) => {
          if (err) {
            reject(err);
          } else {
            resolve(user);
          }
        }
      );
    });
  }

  async pauseOtpInput(uid: string): Promise<IUser | Error | undefined> {
    return new Promise((resolve, reject) => {
      user.findOneAndUpdate(
        { uid },
        {
          $set: {
            pauseOtpInput: true,
            pauseOtpInputUntil: getFutureTimeWithMinutes(15),
          },
        },
        (err: Error, user: IUser) => {
          if (err) {
            reject(err);
          } else {
            resolve(user);
          }
        }
      );
    });
  }
}

export default User;
