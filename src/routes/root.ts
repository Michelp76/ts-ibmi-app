import express from "express";
import db from "../db";

const root = express.Router();

root.get("/descTable/:table", async (req, res) => {
  try {
    // Drop existant
    // const sqlDrop: string = `DROP ALIAS QTEMP.${req.params.table}`;
    // const resDrop = await db.query(sqlDrop);

    // Créer un alias pour accéder au membre
    const sqlCreate: string = `CREATE OR REPLACE ALIAS QTEMP.${req.params.table} FOR netpaisrc.qddssrc (${req.params.table})`;
    const resAlias = await db.query(sqlCreate);

    // Affichage final
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
  } catch (error) {
    console.error(error);
  }
});

export default root;
