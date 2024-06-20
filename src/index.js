import bodyParser from "body-parser";
import express from "express";
import mongoose from "mongoose";
import authRouter from "./routers/authentication.js";
import { config } from 'dotenv';

config();
const mongoURI = process.env.mongoURI;
const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());


const port = process.env.PORT || "8000";
mongoose.connect(mongoURI)
  .then(() => {
    console.log("MongoDB is now connected!")
    // Starting server
    app.listen(port, () => {
      console.log(`Listening to requests on http://localhost:${port}`);
    })
  })
  .catch(err => console.log(err));


app.use("/", authRouter);