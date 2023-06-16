import express, { Express, Response } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/";
import Mongoose from "./controllers/mongoose";
import swagger from "./swagger";
import wss from "./websockets";

import fcm from "./controllers/firebase/fcm";

const server = (): void => {
  const app: Express = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(__dirname + "/public"));
  // app.use("/", (req, res, next) => {
  //   // log full url
  //   console.log(req.protocol + "://" + req.get("host") + req.originalUrl);

  //   // log headers
  //   console.log(req.headers);

  //   return next();
  // });

  // fcm
  //   .sendToDevice(
  //     "esHPx777MUqCksqdXyyRoS:APA91bGg5LgY5c0_ttI5ZLgkn20syJSCDw7YNpiJcqSS9WI3wkk9eIzfXzWJr1Mmqx_-LckYHQp-1Ct40KLFoVlYZfp6fVA2cbNrA1GTzObMIzUvg3uk4Zg_ch8vVUoQth5V_NJ-xXqQ",
  //     `Fuck you gift #${Date.now()}`,
  //     "Hello gift this body is nice"
  //   )
  // .then((e) => {
  //   console.log(e);
  // })
  // .catch((e) => {
  //   console.log(e);
  // });

  /* helmet is used to hide sensitive headers from the api and also add other headers that will help the server run properly */
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          "script-src": [
            "'self'",
            "'unsafe-inline'",
            "https://cdnjs.cloudflare.com",
          ],
          "connect-src": ["'self'", "*"],
        },
      },
    })
  );

  // send to single person

  app.disable("x-powered-by");

  /* compression is used to compress the response body */
  app.use(compression());

  /* cors is used to allow cross origin requests */
  app.use(cors());

  /* dotenv is used to load environment variables from a .env file */
  dotenv.config();

  // app.use("/", (_, __, next) => {
  //   // console.log(req.body, req.ip);
  //   return next();
  // });

  // app.use("*", (req, res, next) => {
  //   var fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
  //   console.log(fullUrl, req.body, req.headers, "1000");
  //   return next();
  // });
  app.get("/test-websocket", (_, res) => {
    res.sendFile("test.html", { root: __dirname + "/public" });
  });

  /* added favicon */

  app.get("/", (_, res: Response) => {
    return res.status(200).send("cargo-dealers api is up and running 🚀");
  });

  app.get("/health", (_, res: Response) => {
    return res.status(200).json({
      status: "success",
      message: "cargo-dealers api is up and running 🚀",
    });
  });

  app.use("/api/v1", routes);

  // app.use('api/v1/webhook', routes);

  //   app.use("/api", routes);

  const db = new Mongoose();
  db.connect()

    .then(async (e) => {
      console.log(e);
      const httpServer: any = app.listen(process.env.PORT, () => {
        swagger(app, process.env.PORT || 3000);
        console.log(`Server started on  http://localhost:${process.env.PORT}`);
      });

      httpServer.setTimeout = 605 * 1000; // 605 seconds

      /*
       * Ensure all inactive connections are terminated by the ALB,
       * by setting this a few seconds higher than the ALB idle timeout
       */
      httpServer.keepAliveTimeout = 605 * 1000; // 605 seconds
      httpServer.headersTimeout = 606 * 1000;
    })
    .then(() => {
      wss(app);
    })

    .catch((e) => {
      console.log(e);
    });
};

export default server;

/**
 * @openapi
 * tags:
 *  - name: user
 *    description: everything that has to do with a user account ranging from signup and login
 *  - name: driver
 *    description: everything that has to do with a driver account ranging from signup and login
 *  - name: general
 *    description: emdpoint that applies to all
 *  - name: trip
 *    description: emdpoint that applies to all trips
 *
 *
 * /health:
 *   get:
 *     tags:
 *      - general
 *     description: get health of the server
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *          application/json:
 *           schema:
 *           type: object
 *           properties:
 *            status:
 *             type: string
 *           example:
 *            status: success
 *            message: cargo-dealers api is up and running 🚀
 *       500:
 *        description: Internal server error
 *
 */
