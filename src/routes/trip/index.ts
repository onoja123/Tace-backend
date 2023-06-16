import { Request, Router, Response } from "express";
import authMiddleware from "../../middlewares/auth";
import GetDetails from "./get-details";
import BookTrip from "./book";
import AcceptTrip from "./accept";
import Start from "./start";
import Init from "./init";
import Update from "./update";
import Summary from "./summary";

const router: Router = Router();

router.use("/:id/update", authMiddleware({ allowUnauthorized: false }), Update);
router.use(
  "/:id/accept",
  authMiddleware({ allowUnauthorized: false }),
  AcceptTrip
);
router.use("/:id/start", authMiddleware({ allowUnauthorized: false }), Start);
router.use("/:id/book", authMiddleware({ allowUnauthorized: false }), BookTrip);
router.use("/init", authMiddleware({ allowUnauthorized: false }), Init);
router.use(
  "/:id/summary",
  authMiddleware({ allowUnauthorized: false }),
  Summary
);
router.use(
  "/get-trip-estimates",
  authMiddleware({ allowUnauthorized: true }),
  GetDetails
);

export default router;
