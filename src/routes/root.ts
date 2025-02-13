import express from "express";
import db from "../db";

const root = express.Router();

// Créer un alias pour accéder au membre
function createAlias(schema: string, rqObject: string): string {
  return `CREATE OR REPLACE ALIAS QTEMP.${rqObject} FOR netpaisrc.${schema} (${rqObject})`;
}

// Créer un alias pour accéder au membre
function selectAlias(rqObject: string): string {
  return `SELECT * FROM QTEMP.${rqObject}`;
}

// Suppression nécessaire (idéalement)
function dropAlias(rqObject: string) {
  return `DROP ALIAS QTEMP.${rqObject}`;
}

// Recherche à quelle table appartient la colonne (reqZone) demandée
function searchSysColumn(rqZone: string): string {
  return `SELECT TABLE_NAME FROM QSYS2.SYSCOLUMNS \
          WHERE TABLE_OWNER = 'GRDEVSPAF' \
          AND TABLE_SCHEMA = '${process.env.DB_DBQ}' \
          AND COLUMN_NAME = '${rqZone}'`;
}

// Interroge les 'spool files' avec les dumps AS400
function searchSpooledFiles(
  jobName: string,
  spoolFile: string,
  spFileNum: number = 0,
  searchString: string = ""
): string {
  let query: string = `SELECT SPOOLED_DATA AS ${spoolFile} FROM TABLE(SYSTOOLS.SPOOLED_FILE_DATA(JOB_NAME => '${jobName}' \
                     , SPOOLED_FILE_NAME => '${spoolFile}' \
                    ${spFileNum > 0 ? ", SPOOLED_FILE_NUMBER => 1" : ""} )) `;
  if (searchString !== "")
    query += `WHERE UPPER(SPOOLED_DATA) LIKE '%${searchString}%'`;
  return query;
}

// Retourne une DDS (description) de fichier
async function descObject(rqObject: string): Promise<any> {
  enum FileType {
    dds = "qddssrc",
    ddl = "qsqlsrc",
    rpg = "qrpglesrc",
    clp = "qclpsrc",
  }

  try {
    let dspSel: any;

    let key: keyof typeof FileType;
    for (key in FileType) {
      const sqlCreate: string = createAlias(FileType[key], rqObject);
      await db.query(sqlCreate);

      try {
        const sqlSel: string = selectAlias(rqObject);
        dspSel = await db.query(sqlSel);
      } catch {
        // Si la requête est invalide, on atterrit ici
        console.log(`requête invalide ou objet '${rqObject}' requêté non trouvé`);
      } finally {
        // Ménage
        const sqlDrop: string = dropAlias(rqObject);
        await db.query(sqlDrop);

        if (dspSel) {
          break; // Sortie prématurée si objet
        }
      }
    }
    return dspSel;
  } catch (error) {
    console.error(error);
  }
}

// Définition de zones pour une table/fichier
root.get("/descObject/:table", async (req, res) => {
  const reqTable: string = req.params.table;

  const result = await descObject(reqTable);
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
      resTable.push(await descObject(srcTable));
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

function findInfoSpl(
  jobLogFile: string[],
  fileType: string,
  keyWordBegin: string,
  keyWordEnd: string
) {
  let foundStr: any = jobLogFile.find((e: any) => e[fileType].includes(keyWordBegin)) as any;
  if (foundStr !== "") {
    const beginPos: number = foundStr[fileType].indexOf(keyWordBegin) + keyWordBegin.length;
    const endPos: number = foundStr[fileType].indexOf(keyWordEnd);
    foundStr = foundStr[fileType].substring(beginPos, endPos);
  }
  return foundStr.toString().trim();
}

// Affiche la "job log" d'un travail (depuis les "spool files")
root.get(
  "/searchJobLog/:jobNum/:jobUser/:jobName/:searchStr?",
  async (req, res) => {
    const jobNum: string = req.params["jobNum"];
    const jobUser: string = req.params["jobUser"];
    const jobName: string = req.params["jobName"];
    const concatJob: string = [jobNum, jobUser, jobName].join(`/`);
    const searchStr: string = req.params["searchStr"] ? req.params["searchStr"] : "";
    let targetProg, targetLine: string;
    // Constantes ----------------------------
    const cFILETYPE_JOBLOG = "QPJOBLOG"
    const cFILETYPE_DMP = "QPPGMDMP"
    const cERR_PROG_BEGIN = "unmonitored by ";
    const cERR_PROG_END = " at";
    const cERR_LINE_BEGIN = " statement";
    const cERR_LINE_END = ", instruction";
    let resFinal: object[] = [];

    try {
      // QPJOBLOG: synthèse des erreurs
      const queryJobLog = await searchSpooledFiles(concatJob, cFILETYPE_JOBLOG);
      const resJobLog: string[] = await db.query(queryJobLog) as string[];
      if (resJobLog.length > 0) {
        // Récupère la ligne dans le source en erreur
        targetProg = findInfoSpl(resJobLog, cFILETYPE_JOBLOG, cERR_PROG_BEGIN, cERR_PROG_END);
        targetLine = findInfoSpl(resJobLog, cFILETYPE_JOBLOG, cERR_LINE_BEGIN, cERR_LINE_END);
        // Objet final renvoyé
        resFinal.push(resJobLog);
      }

      // QPPGMDMP: Dump de toutes les variables
      if (searchStr !== "") {
        const queryDump = await searchSpooledFiles(concatJob, cFILETYPE_DMP, 1, searchStr);
        const resDump = await db.query(queryDump);
        if (resDump.length > 0) {
          // Objet final renvoyé          
          resFinal.push(resDump);
        }
      }

      // Interroge le source + montre ligne en erreur
      const result = await descObject(targetProg);
      if (result.length > 0) {
        // Objet final renvoyé        
        resFinal.push(result)
      }

      if (resFinal.length > 0) {
        // --
        res.json({
          length: resFinal.length,
          resFinal,
        });
      } else {
        res.status(404).json({ error: `jobName '${concatJob}' non trouvé` });
      }
    } catch (error) {
      // Si la requête est invalide, on atterit ici
      console.log(error);
    }
  }
);

export default root;
