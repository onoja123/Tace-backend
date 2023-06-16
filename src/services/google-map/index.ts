//import google
import {
  Client,
  DistanceMatrixResponse,
  TravelMode,
  LatLng,
} from "@googlemaps/google-maps-services-js";
//import google for maps api

//create a new client
export const client = new Client({});

// client;

class GoogleMap {
  public searchLocationsByName(name: string): Promise<any> {
    return client.placeAutocomplete({
      params: {
        input: name,
        key: process.env.GOOGLE_MAPS_API_KEY || "",
      },
    });
  }

  // distance and duration
  public getDistanceAndDuration(
    origin: LatLng,
    destination: any
  ): Promise<DistanceMatrixResponse> {
    return client.distancematrix({
      params: {
        origins: [origin],
        destinations: [destination],
        mode: TravelMode.driving,
        key: process.env.GOOGLE_MAPS_API_KEY || "",
      },
    });
  }

  public getPlaceDetails(placeId: string): Promise<any> {
    return client.reverseGeocode({
      params: {
        place_id: placeId,
        key: process.env.GOOGLE_MAPS_API_KEY || "",
      },
    });
  }

  // public getStateAndCountry(placeId: string): Promise<any> {
  //   return client
  //     .geocode({
  //       params: {
  //         place_id: placeId,
  //         key: process.env.GOOGLE_MAPS_API_KEY || "",
  //       },
  //     })
  //     .then((response) => {
  //       const addressComponents = response.data.results[0].address_components;
  //       if (!addressComponents) {
  //         return Promise.reject("No address components found");
  //       }
  //       const state = addressComponents?.find((c) =>
  //         c?.types?.includes("administrative_area_level_1")
  //       ).long_name;
  //       const country = addressComponents?.find((c) =>
  //         c.types.includes("country")
  //       ).long_name;
  //       return { state, country };
  //     })
  //     .catch((err) => {
  //       // console.error(err);
  //     });
  // }

  public getStateAndCountry(placeId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      client
        .geocode({
          params: {
            place_id: placeId,
            key: process.env.GOOGLE_MAPS_API_KEY || "",
          },
        })
        .then((response) => {
          // console.log(response.data.results[0].geometry);

          const addressComponents = response.data.results[0].address_components;
          if (!addressComponents) {
            return resolve({
              state: "",
              country: "",
              lat: "",
              lng: "",
              address: "",
              placeId: "",
            });
          }

          // console.log(addressComponents);

          const state = addressComponents.find((c: any) => {
            return c.types.includes("administrative_area_level_1");
          })?.long_name;
          const country = addressComponents.find((c: any) => {
            return c.types.includes("country");
          })?.long_name;
          const lat = response.data.results[0].geometry.location.lat;
          const lng = response.data.results[0].geometry.location.lng;
          const address = response.data.results[0].formatted_address;
          const placeId = response.data.results[0].place_id;

          return resolve({ state, country, lat, lng, address, placeId });
        })
        .catch((err) => {
          // console.log(err);

          return resolve({
            state: "",
            country: "",
            lat: "",
            lng: "",
            address: "",
          });
        });
    });
  }

  public getCoodinates(placeId: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      await client
        .placeDetails({
          params: {
            place_id: placeId,
            key: process.env.GOOGLE_MAPS_API_KEY || "",
            fields: ["geometry", "name", "formatted_address"],
          },
        })
        .then((response: any) => {
          if (!response.data.result) {
            return resolve({ lat: 0, lng: 0, formattedAddress: "" });
          }
          const { formatted_address } = response.data.result;
          const { lat, lng } = response?.data?.result?.geometry?.location;
          return resolve({ lat, lng, formattedAddress: formatted_address });
          // const result = response.data.result;
          // const location = result?.geometry.location;
        })
        .catch((err) => {
          // console.log(err);
          return resolve({ lat: 0, lng: 0, formattedAddress: "" });
        });
    });
  }
}

export default new GoogleMap();

// app.get("/map-test/:id", (req, res) => {
//   // client
//   //   .distancematrix({
//   //     params: {
//   //       origins: ["Lagos"],
//   //       destinations: [{ lat: 40.6905615, lng: -73.9976592 }],
//   //       key: "AIzaSyAAa0KXRWkwFQfLJ6aK8h-z0VLxny0q7Ao",
//   //     },
//   //     timeout: 1000, // milliseconds
//   //   })
//   client
//     .placeAutocomplete({
//       params: {
//         input: req.params.id,
//         key: "AIzaSyAAa0KXRWkwFQfLJ6aK8h-z0VLxny0q7Ao",
//       },
//     })
//     .then((r) => {
//       // console.log(r, r.data.rows[0].elements[0].distance);
//       res.send(r.data);
//     })
//     .catch((e) => {
//       console.log(e);
//     });
// });
// app.get("/map-distance/:start/:end", (req, res) => {
//   client
//     .distancematrix({
//       params: {
//         // origins: {
//         // },
//         //use place id
//         // origins: [{ place_id: req.params.id || "" }],
//         // origins: [req.params.id || ""],
//         origins: [`place_id:${req.params.start}`],
//         // destinations: [{ lat: 40.6905615, lng: -73.9976592 }],
//         destinations: [`place_id:${req.params.end}`],
//         key: "AIzaSyAAa0KXRWkwFQfLJ6aK8h-z0VLxny0q7Ao",
//       },
//       timeout: 1000, // milliseconds
//     })
//     // client
//     //   .placeAutocomplete({
//     //     params: {
//     //       input: req.params.id,
//     //       key: "AIzaSyAAa0KXRWkwFQfLJ6aK8h-z0VLxny0q7Ao",
//     //     },
//     //   })
//     .then((r) => {
//       console.log(r, r.data.rows[0].elements[0].distance);
//       res.send(r.data);
//     })
//     .catch((e) => {
//       console.log(e);
//     });
// });

//get locations by name

// uLB6C1bOFFJVCyT3UWWkHz82AZFkjq9f
// default
