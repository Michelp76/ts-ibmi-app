import express from "express";
import db from "../db";

const root = express.Router();

root.get("/descTable/:table", async (req, res) => {
  // Créer un alias pour accéder au membre
  const sql = `CREATE ALIAS QTEMP.${req.params.table} FOR netpaisrc.qddssrc (${req.params.table})`;
  const resAlias = await db.query(sql);
  const result = await db.query(`SELECT * FROM QTEMP.${req.params.table}`);

  if (result.length > 0) {
    // --
    res.json({
      length: result.length,
      result,
    });
  } else {
    res.status(404).json({ error: "no results" });
  }
});

export default root;
