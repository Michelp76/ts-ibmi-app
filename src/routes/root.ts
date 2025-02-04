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

// Retourne une DDS (description) de fichier
async function descTable(rqTable: String): Promise<any> {
  enum FileType {
    dds = "qddssrc",
    ddl = "qsqlsrc",
  }

  try {
    let dspSel: any;

    let key: keyof typeof FileType;
    for (key in FileType) {
      const sqlCreate: string = createAlias(FileType[key], rqTable);
      await db.query(sqlCreate);

      try {
        const sqlSel: string = selectAlias(rqTable);
        dspSel = await db.query(sqlSel);
      } catch {
        // Si la requête est invalide, on atterit ici
        console.log(
          `requête invalide ou objet '${rqTable}' requêté non trouvé`
        );
      } finally {
        // Ménage
        const sqlDrop: string = dropAlias(rqTable);
        await db.query(sqlDrop);

        if (dspSel) {
          break; // Sortie prématurée si dds trouvé dans qddssrc
        }
      }
    }
    return dspSel;
  } catch (error) {
    console.error(error);
  }
}

// Recherche à quelle table appartient la colonne (reqZone) demandée
function searchSysColumn(rqZone: String): string {
  return `SELECT TABLE_NAME FROM QSYS2.SYSCOLUMNS \
          WHERE TABLE_OWNER = 'GRDEVSPAF' \
          AND TABLE_SCHEMA = '${process.env.DB_DBQ}' \
          AND COLUMN_NAME = '${rqZone}'`;
}

// Définition de zones pour une table/fichier
root.get("/descTable/:table", async (req, res) => {
  const reqTable: string = req.params.table;

  const result = await descTable(reqTable);
  if (result.length > 0) {
    // --
    res.json({
      length: result.length,
      result,
    });
  } else {
    res.status(404).json({ error: "pas de description de fichier" });
  }
});

// Recherche de zones dans tables/fichiers AS400
root.get("/searchTables/:zone", async (req, res) => {
  const reqZone: string = req.params.zone.toUpperCase();

  // Recherche à quelle table appartient la colonne (reqZone) demandée
  const sqlQuery: string = searchSysColumn(reqZone);
  const result = await db.query(sqlQuery);

  // Une fois cette table trouvée, affichage de sa/ses description(s)
  let resTable: any[] = [];
  if (result.length > 0) {
    for (let i = 0; i < result.length; i++) {
      let srcTable: string = Object.values(result[i] as string)[0];
      resTable.push(await descTable(srcTable));
    }
    if (resTable.length > 0) {
      // --
      res.json({
        length: resTable.length,
        resTable,
      });
    } else {
      res.status(404).json({ error: "pas de description de fichier" });
    }
  }
});

export default root;
