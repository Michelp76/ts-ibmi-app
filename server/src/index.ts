import express from "express";
import { json } from "body-parser";
import dotenv from 'dotenv';
dotenv.config();

import db, { connectionString } from "./db";
import root from "./routes/root";

const app = express();
const port = process.env.PORT || 3000;

app.use(json());
app.use(root);

(async () => {
  try {
    await db.connect(connectionString);
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`)
    });
  } catch (error: any) {
    console.log(`error: ${error}`)
  };
})();