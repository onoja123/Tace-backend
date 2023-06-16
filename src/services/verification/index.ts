import axios from "axios";

export const fetchDataDOJAH = async (
  url: string,
  headers: any,
  method: string,
  data: string
) => {
  const option = {
    url: url,
    method,
    headers,
  };
  const request = await axios(option);
  return request;
};

const imageToString = (src: string, callback: any) => {
  const image = new Image();
  image.crossOrigin = "Anonymous";
  image.onload = () => {
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    canvas.height = image.naturalHeight;
    canvas.width = image.naturalWidth;
    if (context) {
      context.drawImage(image, 0, 0);
    }
    var dataURL = canvas.toDataURL("image/jpeg");
    callback(dataURL);
  };
  image.src = src;
};

/**
 * @param {string} license the Driver License
 */
//  export const verifyDriverLicense = async ( license:string )=>{
//     try {
//         const data = license

//         const verify = await fetchDataDOJAH(`${process.env.DOJAH_API_BASE_URL}/api/v1/kyc/dl?license_number=${data}`, "GET", "")
//         return verify
//     } catch (error) {
//         return error
//     }
// }

/**
 * @param {string} nin the Driver NIN
 */
//  export const verifyNIN = async ( nin:string )=>{
//     try {
//         const data = nin

//         const verify = await fetchDataDOJAH(`${process.env.DOJAH_API_BASE_URL}/api/v1/kyc/dl?lnin=${data}`, "GET", "")
//         return verify
//     } catch (error) {
//         return error
//     }
// }

// /**
//  * @note This Whole function isnt working yet __ I would `finish it if it need`
//  * @param {string} imagepath image path this is to change the image to data:image/jpeg;base64 before posting
//  * @param {string} nin the user NIN code
//  */
//  export const verifyNINWithSelfie = async (imagepath:string, nin:string)=>{
//     try {
//         const newImage = imageToString(imagepath, (dataNew :any) =>{
//             return dataNew
//         })
//         const data = JSON.stringify({
//             "selfie_image" : newImage,
//             "nin" : nin
//         })
//         const verify = await fetchDataDOJAH(`${process.env.DOJAH_API_URL}/api/v1/kyc/nin/verify`, "POST", data)
//     } catch (error) {
//         return error
//     }
// }
