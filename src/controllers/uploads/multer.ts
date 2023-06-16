import { Request } from "express";
import multer, { FileFilterCallback } from "multer";
import path from "path";

export const multerConfigImg = multer({
  storage: multer.diskStorage({
    // destination: function (_, __, cb) {
    //   cb(null, "/temp-storage");
    // },
    // filename(req, file, callback) {
    //   console.log(file);
    //   callback(
    //     null,
    //     file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    //   );
    // },
  }),
  fileFilter(_, file: Express.Multer.File, cb: multer.FileFilterCallback) {
    const fileTypes = /jpeg|jpg|png|gif|webp|pdf/;
    // const fileTypes = /jpeg|jpg|png|gif|mp4|/;
    const extName: string | any = path.extname(file.originalname).toLowerCase();
    const isValid = fileTypes.test(extName);
    if (!isValid) {
      return cb(new Error(JSON.stringify({ message: "Invalid file type" })));
    }
    cb(null, true);
  },
});
// export default { multerConfigImg };

// req: Request,
// file: { original_filename: any },
// cb: (arg0: Error | null, arg1: boolean) => void
