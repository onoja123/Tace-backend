import { request, Request, Response, Router } from "express";
import LocationSearch from "./search";

import googleMap from "../../services/google-map";
const router: Router = Router();

router.get("/location/search/", LocationSearch);

router.get(
  "/location/:placeid",
  async (request: Request, response: Response) => {
    const { placeid } = request.params;
    const placeDetails = await googleMap.getPlaceDetails(placeid);
    return response.status(200).send({
      status: "success",
      message: "Place details",
      data: placeDetails.data,
    });
  }
);

export default router;
