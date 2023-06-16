import { config } from "dotenv";
import http from "http";
import { verify } from "jsonwebtoken";
import { Server } from "socket.io";
import RedisClient from "../controllers/redis";
import { decodeJWT, decodeString } from "../helpers";
import tripModel from "../models/trip.model";
import Users, { ridersOnlyDriverTypes } from "../models/user.model";
config();

let io: Server;

const wss = (app: any) => {
  console.log("Websocket server started");

  const server = new http.Server(app);

  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", async (socket) => {
    console.log("a user connected");

    const authorization = socket.handshake.headers.authorization;
    // console.log(authorization);
    // console.log(">>>>>>>>", socket.handshake.headers);

    if (!authorization) return socket.disconnect();

    const [bearer, token] = authorization.split(" ");

    if (!bearer || bearer?.toLowerCase() !== "bearer" || !token)
      return socket.disconnect();

    const decodedToken: any = await decodeJWT(token);

    console.log(decodedToken);
    if (!decodedToken) return socket.disconnect();

    const { uid } = decodedToken.data;

    if (!uid) return socket.disconnect();

    const user = await Users.findOne({
      $and: [
        {
          uid,
        },
        {
          "account.type": {
            $in: ridersOnlyDriverTypes,
          },
        },
      ],
    });

    console.log(user);

    if (!user) return socket.disconnect();

    let key = await decodeString(user.key);
    try {
      const verifiedJwt = await verify(token, key);
      if (!verifiedJwt) return socket.disconnect();
    } catch (err) {
      console.log(err);
      return socket.disconnect();
    }

    console.log("a user connected:" + user.uid);
    socket.join(user.uid);

    // set user online
    socket.emit("connected", user.uid);
    await Users.updateOne({ uid }, { $set: { isOnline: true } });

    socket.on("disconnect", async () => {
      socket.leave(user.uid);
      await Users.updateOne({ uid }, { $set: { isOnline: false } });
      console.log("user disconnected", user.uid);
    });

    socket.on("accept-ride", async (tripId) => {
      try {
        const tripDetails = await tripModel.findOne({
          id: tripId,
        });

        if (!tripDetails) {
          socket.emit("trip-error", {
            message: "Trip not found",
          });
          return;
        }

        if (tripDetails.status !== "pending") {
          socket.emit("trip-error", {
            message: "Trip is not pending",
          });
          return;
        }

        await tripModel.updateOne(
          { id: tripId },
          {
            $set: {
              status: "awaiting-pickup",
              driver: user._id,
            },
          }
        );
      } catch (err) {
        console.log("err:", err);
        socket.emit("trip-error", {
          message: "An error occured while accepting trip",
        });
      }
    });

    //listen for any type of emit
    socket.onAny((event, ...args) => {
      console.log(event, args);
    });
  });

  io.listen(process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 6790);
};

// io.emit("some event", {
//   someProperty: "some value",
//   otherProperty: "other value",
// });

export { io };
export default wss;
