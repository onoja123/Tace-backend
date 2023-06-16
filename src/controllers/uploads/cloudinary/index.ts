import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { unlinkSync } from "fs";

dotenv.config();

cloudinary.config({
  cloud_name: process.env["CLOUDINARY_CLOUD_NAME"],
  api_key: process.env["CLOUDINARY_API_KEY"],
  api_secret: process.env["CLOUDINARY_API_SECRET_KEY"],
});

const unlinkFile = async (fileName: string) => {
  unlinkSync(fileName);
};
class Cloudinary {
  constructor() {}
  upload(
    file: Express.Multer.File,
    // defaultFolder?: string,
    deleteWhenDone: boolean = true,
    extraParams: any = {}
  ) {
    return new Promise(async (resolve, reject): Promise<any> => {
      try {
        const fileKind = file.mimetype.split("/")[0];
        let folder = "";

        if (fileKind === "image") {
          folder = "images";
        } else if (fileKind === "video") {
          folder = "videos";
        }

        const result = await cloudinary.uploader.upload(file.path, {
          //   folder: defaultFolder ? defaultFolder : folder,
          ...extraParams,
        });

        if (deleteWhenDone) {
          /* deletes file from disk after upload */
          unlinkFile(file.path);
        }
        return resolve({
          status: "success",
          url: result.secure_url,
          publicId: result.public_id,
        });
      } catch (err) {
        reject({
          status: "error",
          message: "There was an error uploading the file",
        });

        unlinkFile(file.path);
      }
    });
  }
  delete(fileId: string) {
    return new Promise(async (resolve, reject) => {
      try {
        await cloudinary.uploader.destroy(fileId);
        resolve({
          status: "success",
          message: "Image(s) deleted successfully",
        });
      } catch (err) {
        reject({
          status: "error",
          message: "There was an error deleting the file",
        });
      }
    });
  }
  get(fileId: string) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await cloudinary.api.resource(fileId);
        resolve({
          status: "success",
          data: result,
        });
      } catch (err) {
        reject(err);
      }
    });
  }
}

export default new Cloudinary();
