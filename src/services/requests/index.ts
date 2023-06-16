import axios from "axios";

export const sendMessage = async (
  numbers: string | string[],
  message: string
) => {
  return new Promise(async (resolve, reject) => {
    const apiKey = process.env.INFOBIP_API_KEY;
    const apiUrl = process.env.INFOBIP_URL || " ";

    const destinations = Array.isArray(numbers)
      ? numbers.map((n) => ({ to: n }))
      : [{ to: numbers }];

    const postData = {
      messages: [
        {
          destinations,
          from: "CARGODEALER",
          text: message,
        },
      ],
    };

    try {
      const response = await axios.post(
        apiUrl,
        // {
        //   from: "CARGODEALER",
        //   to: Array.isArray(numbers) ? numbers : [numbers],
        //   text: "message",
        // },
        postData,
        {
          headers: {
            method: "POST",
            Authorization: `App ${apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      return resolve(response.data);
    } catch (error: any) {
      console.log(error, "eeeee");
      return reject(error.response.data);
    }
  });
};
