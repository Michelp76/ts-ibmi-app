import express from "express";
import db from "../db";

const root = express.Router();

root.get("/descTable/:table", async (req, res) => {
  // TODO: aller piocher aussi bien dans QSQLSRC (tout autant que QDDSSRC)
  const reqTable: String = req.params.table;

  try {
    // Créer un alias pour accéder au membre
    const sqlCreate: string = `CREATE OR REPLACE ALIAS QTEMP.${reqTable} FOR netpaisrc.qddssrc (${reqTable})`;
    const resAlias = await db.query(sqlCreate);

    // Affichage final
    const result = await db.query(`SELECT * FROM QTEMP.${reqTable}`);

    // Ménage (à faire cf. https://www.rpgpgm.com/2014/09/accessing-multiple-member-files-in-sql.html)
    const sqlDrop: string = `DROP ALIAS QTEMP.${reqTable}`;
    const resDrop = await db.query(sqlDrop);

    if (result.length > 0) {
      // --
      res.json({
        length: result.length,
        result,
      });
    } else {
      res.status(404).json({ error: "pas de description de fichier" });
    }
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: ` fichier inexistant : ${reqTable}` });
  }
});

export default root;
