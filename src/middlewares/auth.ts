// middleware for auth
import { Request, Response, NextFunction } from "express";
import { JwtPayload, verify } from "jsonwebtoken";
import { decodeJWT, decodeString } from "../helpers";
import Users from "../models/user.model";

const authMiddleware = (params?: { allowUnauthorized?: boolean }) => {
  return async (request: Request, response: Response, next: NextFunction) => {
    // console.log(
    //   "params:",
    //   request.headers,
    //   request.body,
    //   // log full url
    //   request.protocol + "://" + request.get("host") + request.originalUrl
    // );

    const { authorization } = request.headers;

    if (!authorization && params?.allowUnauthorized) return next();

    if (!authorization) {
      return response.status(401).send({
        status: "error",
        message: "Unauthorized",
        data: null,
      });
    }

    const [bearer, token] = authorization.split(" ");

    if (bearer !== "Bearer" || !token) {
      return response.status(401).send({
        status: "error",
        message: "Unauthorized",
        data: null,
      });
    }

    // get token look for user and make sure its valid
    const decodedToken: any = await decodeJWT(token);

    if (!decodedToken && params?.allowUnauthorized) return next();

    if (!decodedToken) {
      return response.status(401).send({
        status: "error",
        message: "Unauthorized",
        data: null,
      });
    }

    const { uid } = decodedToken.data as JwtPayload;

    if (!uid && params?.allowUnauthorized) return next();

    if (!uid) {
      return response.status(401).send({
        status: "error",
        message: "Unauthorized",
        data: null,
      });
    }

    const user = await Users.findOne({
      uid,
    });

    if (!user && params?.allowUnauthorized) return next();

    if (!user) {
      return response.status(401).send({
        status: "error",
        message: "Unauthorized",
        data: null,
      });
    }

    let key = user?.key as string;

    if (!key && params?.allowUnauthorized) return next();
    if (!key) {
      return response.status(401).send({
        status: "error",
        message: "Unauthorized",
        data: null,
      });
    }

    key = await decodeString(key);

    if (!key) {
      return response.status(401).send({
        status: "error",
        message: "Unauthorized",
        data: null,
      });
    }

    if (!user) {
      return response.status(401).send({
        status: "error",
        message: "Unauthorized",
        data: null,
      });
    }

    try {
      const verifiedJwt = await verify(token, key);

      if (!verifiedJwt && params?.allowUnauthorized) return next();
      if (!verifiedJwt) {
        return response.status(401).send({
          status: "error",
          message: "Unauthorized",
          data: null,
        });
      }

      request.user = {
        uid: user.uid,
        email: user.email,
        _id: user._id,
        account: user?.account,
        phoneNumber: user?.phoneNumber,
        firstname: user?.firstname,
        lastname: user?.lastname,
        country: user?.country,
      };
    } catch (err) {
      if (params?.allowUnauthorized) return next();
      return response.status(401).send({
        status: "error",
        message: "Unauthorized",
        data: null,
      });
    }

    return next();
  };
};

export default authMiddleware;
