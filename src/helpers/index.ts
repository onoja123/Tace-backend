import crypto from "crypto";
import { compareSync, genSaltSync, hashSync } from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import otpGenerator from "otp-generator";
import jwt from "jsonwebtoken";
import moment from "moment";
import multer from "multer";
import { config } from "dotenv";
import qr from "qrcode";
import { v4 } from "uuid";
import { unlinkSync } from "fs";
// import isoCountryCodes from "iso-country-codes";
import isoCountries from "iso-3166-1";

config();

cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
  api_key: process.env["CLOUDINARY_API_KEY"],
  api_secret: process.env["CLOUDINARY_API_SECRET_KEY"],
});

export const isEmpty = (...args: string[]): boolean => {
  let push: boolean = false;
  args.every((e: string) => {
    if (!e || e.trim() === "") push = true;
    return false;
  });
  return push;
};

export const isValidUsername = (val: string): boolean => {
  const usernameRegex = /^[a-z0-9_.]+$/;
  return usernameRegex.test(val);
};

export const hashString = (itemToHash: string): string => {
  const salt = genSaltSync(10);
  const hash = hashSync(itemToHash, salt);
  return hash;
};

export const getFutureTimeWithMinutes = (minutes: number): Date => {
  return new Date(Date.now() + minutes * 60000);
};

export const minutesToSeconds = (minutes: number): number => {
  return minutes * 60;
};

export const getCurrentDateInSeconds = (): number => {
  return Math.floor(Date.now() / 1000);
};

export const comparePasswords = (password: string, hash: string): boolean => {
  return compareSync(password, hash);
};

export const generateRandomToken = (): string => {
  return crypto.randomBytes(16).toString("hex");
};

export const secondsToDate = (seconds: number, format?: string): string => {
  return moment.unix(seconds).format(format || "dddd MMMM Do YYYY, h:mm:ss a");
};

export const generateOtp = (length: number): string => {
  return otpGenerator.generate(length, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
};

export const isValidName = (name: string): boolean => {
  // const nameRegex = /^[a-zA-Z ]+$/;
  return /^[a-zA-Z ]+$/.test(name);
};

export const signJWT = (payload: any, secret: string) => {
  return jwt.sign(
    {
      data: payload,
      exp: Math.floor(Date.now() / 1000) + 60 * 60,
    },
    secret
  );
};

export const decodeJWT = (token: string) => {
  return jwt.decode(token);
};

export const isValidLatLng = (lat: number, lng: number): boolean => {
  // Check if the latitude is a number
  if (typeof lat !== "number") return false;

  // Check if the longitude is a number
  if (typeof lng !== "number") return false;

  // Check if the latitude is within the valid range
  if (lat < -90 || lat > 90) return false;

  // Check if the longitude is within the valid range
  if (lng < -180 || lng > 180) return false;

  // If all checks pass, the latitude and longitude are valid
  return true;
};

export const isValidCountry = (country: string): boolean => {
  // const isValidCountry = isoCountries.whereCountry(country);
  // console.log(isValidCountry);

  // if (isValidCountry) {
  //   // Country is valid
  //   return true;
  // } else {
  //   return false;
  //   // Country is invalid
  // }

  const countryInfo = isoCountries.whereAlpha2(country);
  if (countryInfo) {
    // Country abbreviation is valid
    return true;
  }

  const isValidName = isoCountries.whereCountry(country);
  if (isValidName) {
    // Country name is valid
    return true;
  }

  return false;
};

export const getCountryDetails = (country: string): any => {
  const countryInfo = isoCountries.whereAlpha2(country);
  if (countryInfo) {
    // Country abbreviation is valid
    return countryInfo;
  }

  const isValidName = isoCountries.whereCountry(country);
  if (isValidName) {
    // Country name is valid
    return isValidName;
  }

  return null;
};

// const crypto = require('crypto');

// the message to encode
// const message = "This is a secret message";

// // the secret key to use for encoding and decoding
// const secretKey = "my_secret_key";

// // create the cipher object using the aes256 algorithm and the secret key
// const cipher = crypto.createCipher("aes256", secretKey);

// // encode the message using the cipher and convert it to a hexadecimal string
// const encodedMessage =
//   cipher.update(message, "utf8", "hex") + cipher.final("hex");

// // create the decipher object using the aes256 algorithm and the secret key
// const decipher = crypto.createDecipher("aes256", secretKey);

// // decode the encoded message using the decipher and convert it back to a utf8 string
// const decodedMessage =
//   decipher.update(encodedMessage, "hex", "utf8") + decipher.final("utf8");

// console.log(`Encoded message: ${encodedMessage}`);
// console.log(`Decoded message: ${decodedMessage}`);

export const encodeString = (str: string): string => {
  const algorithm = "aes-256-cbc";
  const key =
    Buffer.from(
      process.env.ENCODE_DECODE_SECRET_KEY
        ? process.env.ENCODE_DECODE_SECRET_KEY
        : "",
      "hex"
    ) || "";
  const iv =
    Buffer.from(
      process.env.ENCODE_DECODE_IV ? process.env.ENCODE_DECODE_IV : "",
      "hex"
    ) || "";

  // const cipher = crypto.createCipher(
  //   "aes256",
  //   process.env.ENCODE_DECODE_SECRET_KEY || ""
  // );
  // return cipher.update(str, "utf8", "hex") + cipher.final("hex");
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(str, "utf8", "hex");
  encrypted += cipher.final("hex");

  return encrypted;
};

export const decodeString = async (str: string): Promise<any> => {
  const algorithm = "aes-256-cbc";
  const key =
    Buffer.from(
      process.env.ENCODE_DECODE_SECRET_KEY
        ? process.env.ENCODE_DECODE_SECRET_KEY
        : "",
      "hex"
    ) || "";
  const iv =
    Buffer.from(
      process.env.ENCODE_DECODE_IV ? process.env.ENCODE_DECODE_IV : "",
      "hex"
    ) || "";
  const decipher = crypto.createDecipheriv(algorithm, key, iv);

  try {
    let decrypted = await decipher.update(str, "hex", "utf8");
    decrypted += await decipher.final("utf8");
    if (!decrypted) return Promise.reject("Invalid token");
    return Promise.resolve(decrypted);
  } catch (err) {
    return Promise.reject(err);
  }
};

export const generateQrCodeURL = (data: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    // qr.toDataURL(data, (err: any, url: any) => {
    //   if (err) reject(err);
    //   resolve(url);
    // });
    try {
      const tempFilePath = "./" + v4() + ".png";
      qr.toFile(tempFilePath, data, async (err) => {
        if (err) reject(err);
        // resolve(tempFilePath);

        //upload to cloudinary
        //  cloudinary.up
        // cloudinary.upload(tempFilePath, (err, res) => {});
        const result = await cloudinary.uploader.upload(tempFilePath, {
          //   folder: defaultFolder ? defaultFolder : folder,
          upload_preset: "qr-preset",
          folder: "/images/qr-codes",
        });
        if (result) {
          // delete file from local
          unlinkSync(tempFilePath);
          return resolve(result.secure_url);
        } else return reject("Error uploading to cloudinary");
      });
    } catch (err) {
      console.log("err:" + err);

      reject(err);
    }
  });
  // return QRCode.toDataURL(text);
  //
  // const qr = qrcode(0, "L");
};
