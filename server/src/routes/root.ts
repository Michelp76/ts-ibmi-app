import express from "express";
import db from "../db";

// Pour lancer des CL et RPGLE : librairie iToolkit 
// https://github.com/IBM/nodejs-itoolkit/issues/391

const root = express.Router();

// Créer un alias pour accéder au membre
function createAlias(schema: string, rqObject: string): string {
  return `CREATE OR REPLACE ALIAS QTEMP.${rqObject} FOR ${process.env.DB_SRC}.${schema} (${rqObject})`;
}

// Afficher le contenu du membre 'aliasé'
function selectAlias(rqObject: string): string {
  return `SELECT SRCSEQ, SRCDTA AS "data" FROM QTEMP.${rqObject}`;
}

// Suppression nécessaire (idéalement)
function dropAlias(rqObject: string): string {
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
  let query: string = `SELECT SPOOLED_DATA AS "data" FROM TABLE(SYSTOOLS.SPOOLED_FILE_DATA(JOB_NAME => '${jobName}' \
                     , SPOOLED_FILE_NAME => '${spoolFile}' \
                    ${spFileNum > 0 ? ", SPOOLED_FILE_NUMBER => 1" : ""} )) `;
  if (searchString !== "")
    query += `WHERE UPPER(SPOOLED_DATA) LIKE '%${searchString}%'`;
  return query;
}

// liste exhaustive Tables 
function listTables(): string {
  let query: string = `SELECT TABLE_NAME AS "key", TABLE_NAME AS "value" FROM QSYS2.SYSTABLES WHERE TABLE_SCHEMA = '${process.env.DB_DBQ}'`
  return query;
}

// liste exhaustive Programmes
function listProgs(): string {
  let query: string = `SELECT SYSTEM_TABLE_MEMBER AS "key", SYSTEM_TABLE_MEMBER AS "value" FROM QSYS2.SYSPARTITIONSTAT WHERE
  SYSTEM_TABLE_SCHEMA = '${process.env.DB_SRC}' AND (SYSTEM_TABLE_NAME = 'QRPGLESRC' OR SYSTEM_TABLE_NAME = 'QCLPSRC')`
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
        // Ouverture des droits aux sources
        // let result = await db.query("call qgpl.sosdevpai");
        // let result = await db.callProcedure(null, "qgpl", "sosdevpai");

        const sqlSel: string = selectAlias(rqObject);
        dspSel = await db.query(sqlSel);
      } catch (error) {
        // Si la requête est invalide, on atterrit ici
        console.log(`requête invalide ou objet '${FileType[key]}.${rqObject}' requêté non trouvé: ${error}`);
      } finally {
        // Ménage
        const sqlDrop: string = dropAlias(rqObject);
        await db.query(sqlDrop);

        if (dspSel) {
          break; // Sortie prématurée si objet déjà trouvé
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
  if (result && result.length > 0) {
    // --
    res.json({ length: result.length, result, });
  } else {
    res.status(404).json({ error: "pas de description de fichier" });
  }
});

// Définition de zones pour une table/fichier
root.get("/listObjectsAS400/", async (req, res) => {

  // Tables / Fichiers
  const sqlTables: string = listTables();
  const resultTables = await db.query(sqlTables);
  if (resultTables != undefined) {
    if (resultTables.length === 0) {
      res.status(404).json({ error: "pas de table(s) trouvée(s)" });
    }
  }
  // Progs  
  const sqlProgs = listProgs();
  const resultProgs = await db.query(sqlProgs);
  if (resultProgs != undefined) {
    if (resultProgs.length === 0) {
      res.status(404).json({ error: "pas de programmes(s) trouvé(s)" });
    }
  }
  const combinedArray = [...resultTables as any[], ...resultProgs as any[]];
  if (combinedArray.length > 0) {
    // --
    res.json({ length: combinedArray.length, combinedArray, });
  } else {
    res.status(404).json({ error: "pas d'objets trouvé(s)" });
  }
});

// Recherche de zones dans tables/fichiers AS400
root.get("/searchTables/:zone", async (req, res) => {
  const reqZone: string = req.params.zone.toUpperCase();
  let resTable: any[] = [];

  // Recherche à quelle table appartient la colonne (reqZone) demandée
  const sqlQuery: string = searchSysColumn(reqZone);
  const result = await db.query(sqlQuery);

  if (result != undefined) {
    // Une fois cette table trouvée, affichage de sa/ses description(s)
    if (result.length > 0) {
      for (let i = 0; i < result.length; i++) {
        let srcTable: string = Object.values(result[i] as string)[0];
        resTable.push(await descObject(srcTable));
      }
    }
  }
  if (resTable.length > 0) {
    // --
    res.json({ length: resTable.length, resTable, });
  } else {
    res.status(404).json({ error: "pas de description de fichier" });
  }
});

function findInfoSpl(
  jobLogFile: string[],
  keyWordBegin: string,
  keyWordEnd: string
) {
  let foundStr: any = jobLogFile.find((e: any) => e["data"].includes(keyWordBegin)) as any;
  if (foundStr !== "") {
    const beginPos: number = foundStr["data"].indexOf(keyWordBegin) + keyWordBegin.length;
    const endPos: number = foundStr["data"].indexOf(keyWordEnd);
    foundStr = foundStr["data"].substring(beginPos, endPos);
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
    let targetProg, targetLine: string = "";

    // Constantes ----------------------------
    const cFILETYPE_JOBLOG = "QPJOBLOG"
    const cFILETYPE_DMP = "QPPGMDMP"
    const cERR_PROG_BEGIN = "unmonitored by ";
    const cERR_PROG_END = " at";
    const cERR_LINE_BEGIN = " statement";
    const cERR_LINE_END = ", instruction";
    let result: object[] = [];

    try {
      // QPJOBLOG: synthèse des erreurs
      const queryJobLog = await searchSpooledFiles(concatJob, cFILETYPE_JOBLOG);
      const resJobLog: string[] = await db.query(queryJobLog) as string[];
      if (resJobLog.length > 0) {
        // Objet final renvoyé
        result.push(resJobLog);

        // Récupère la ligne dans le source en erreur
        targetProg = findInfoSpl(resJobLog, cERR_PROG_BEGIN, cERR_PROG_END);
        targetLine = findInfoSpl(resJobLog, cERR_LINE_BEGIN, cERR_LINE_END);

        // QPPGMDMP: Dump de toutes les variables (/!\ long à afficher)
        // if (searchStr !== "") {    // Finalement, avec le VirtualizedRenderer, le log complet s'affiche dans des temps raisonnables
        const queryDump = await searchSpooledFiles(concatJob, cFILETYPE_DMP, 1, searchStr);
        const resDump = await db.query(queryDump);
        if (resDump != undefined) {
          if (resDump.length > 0) {
            // Objet final renvoyé
            result.push(resDump);
          }
        }
        // }

        // Interroge le source + montre ligne en erreur
        if (targetProg !== "") {
          const resSrcFile = { "SRCPROG": `${targetProg}` }
          // Objet final renvoyé        
          result.push(resSrcFile)
        }

        if (targetLine !== "") {
          let oldLine, newLine: number = 0;
          oldLine = +targetLine;
          if (oldLine > 1000) {
            newLine = oldLine / 100;
          }
          const resSrcLine = { "SRCLINE": `${newLine}` }
          // Objet final renvoyé        
          result.push(resSrcLine);
        }
      }
      if (result.length > 0) {
        // --
        res.json({ length: result.length, result, });
      } else {
        res.status(404).json({ error: `jobName '${concatJob}' non trouvé` });
      }
    } catch (error) {
      // Si la requête est invalide, on atterrit ici
      console.log(error);
    }
  }
);

export default root;
