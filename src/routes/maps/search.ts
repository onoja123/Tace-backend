import { Request, Response, Router } from "express";
import { client } from "../../services/google-map";

// const router: Router = Router();

const LocationSearch = async (
  req: Request<
    {},
    {},
    {},
    {
      q?: string;
      query?: string;
    }
  >,
  res: Response
) => {
  try {
    const query = req.query.q || req.query.query || "";

    if (!query) {
      return res.status(400).json({ message: "query is required" });
    }

    const response = await client.placeAutocomplete({
      params: {
        input: query,
        key: process.env.GOOGLE_MAPS_API_KEY || "",
      },
    });

    // sort data and get the first 7 and oly send id , description and place_id and formatted_address
    console.log(response.data.predictions);

    const data = response.data.predictions
      .map((item: any) => {
        return {
          description: item.description,
          place_id: item.place_id,
          formatted_address: item.structured_formatting.main_text,
        };
      })
      .slice(0, 7);

    return res.status(200).json({
      status: "success",
      message: "location search successful",
      data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "error",
      message: "An error occured",
      error: "An error occured",
    });
  }
};

export default LocationSearch;
