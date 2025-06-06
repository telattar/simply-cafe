import bodyParser from "body-parser";
import express from "express";
import mongoose from "mongoose";
import authRouter from "./routers/authentication.js";
import { config } from "dotenv";
import requireAuth from "./middleware/authMiddleware.js";
import cookieParser from "cookie-parser";
import itemRouter from "./routers/item.js";
import bundleRouter from "./routers/bundles.js";
import menuRouter from "./routers/menu.js";
import orderRouter from "./routers/order.js";

config();

const app = express();
app.use(cookieParser());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

const port = process.env.PORT || "8000";
mongoose
  .connect(process.env.mongoURI)
  .then(() => {
    console.log("MongoDB is now connected!");
    // Starting server
    app.listen(port, () => {
      console.log(`Listening to requests on http://localhost:${port}`);
    });
  })
  .catch((err) => console.log(err));

app.use("/", authRouter);
app.use("/items", requireAuth, itemRouter);
app.use("/bundles", requireAuth, bundleRouter);
app.use("/menu", requireAuth, menuRouter);
app.use("/orders", requireAuth, orderRouter);
export default app;
