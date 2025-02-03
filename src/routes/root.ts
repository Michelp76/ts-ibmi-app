import express from "express";
import db from "../db";

const root = express.Router();

// Créer un alias pour accéder au membre
function createAlias(schema: String, rqTable: String): string {
  return `CREATE OR REPLACE ALIAS QTEMP.${rqTable} FOR netpaisrc.${schema} (${rqTable})`;
}

// Créer un alias pour accéder au membre
function selectAlias(rqTable: String): string {
  return `SELECT * FROM QTEMP.${rqTable}`;
}

// Suppression nécessaire (idéalement)
function dropAlias(rqTable: String) {
  return `DROP ALIAS QTEMP.${rqTable}`;
}

root.get("/descTable/:table", async (req, res) => {
  const reqTable: string = req.params.table;

  enum FileType {
    dds = "qddssrc",
    ddl = "qsqlsrc",
  }

  try {
    let dspSel: any;

    let key: keyof typeof FileType;
    for (key in FileType) {
      const sqlCreate: string = createAlias(FileType[key], reqTable);
      await db.query(sqlCreate);

      try {
        const sqlSel: string = selectAlias(reqTable);
        dspSel = await db.query(sqlSel);
      } catch {
        // Si la requête est invalide, on atterit ici
      } finally {
        // Ménage
        const sqlDrop: string = dropAlias(reqTable);
        await db.query(sqlDrop);

        if (dspSel) {
          break; // Sortie prématurée si dds trouvé dans qddssrc
        }
      }
    }

    if (dspSel.length > 0) {
      // --
      res.json({
        length: dspSel.length,
        dspSel,
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
