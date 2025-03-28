import odbc, { Result } from "odbc";

export default class {
  private static pool: odbc.Pool;
  private static ERROR_IBMI_DISCONNECTED: string = 'Communication link failure. comm rc=10054 - CWBCO1047 - The IBM i server application  disconnected the connection';

  static async connect(connectionString: string) {
    this.pool = await odbc.pool({
      connectionString,
      initialSize: 5,
      maxSize: 10,
    });
  }

  /**
   * @throws Will crash if query is invalid
   */
  /*
  static query<T>(statement: string, bindingsValues: (number|string)[] = []): Promise<T[]> {
    return this.pool.query(statement, bindingsValues) as Promise<T[]>;
  }
  */
  static async query<T>(statement: string, bindingsValues: (number | string)[] = []) {
    let result;
    try {
      result = await this.pool.query(statement, bindingsValues);
    } catch (error: any) {
      // Gère l'erreur de perte de connexion "rc=10054 - CWBCO1047"
      if (error.odbcErrors[0].code == 10054) {
        // if (error.odbcErrors[0].message.includes(this.ERROR_IBMI_DISCONNECTED)) {
        console.log(`Perte de connexion (fonction 'query' - src/index.ts): ${error}`)
        console.log(this.ERROR_IBMI_DISCONNECTED);
        // Reconnexion
        await this.connect(connectionString);
        console.log('Running query on new pool');
        // Relance la requête initiale
        result = await this.pool.query(statement, bindingsValues);
      }
    } finally {
      return result;
    }
  }

  static async callProcedure<T>(catalog: string | null, library: string, procedure: string, bindingsValues: (number | string)[] = []) {
    const connection = await this.pool.connect();
    return connection.callProcedure(catalog, library, procedure, bindingsValues);
  }
}

export const connectionString = [
  `DRIVER={Client Access ODBC Driver (32-bit)}`,
  `SYSTEM=${process.env.DB_HOST}`,
  `uid=${process.env.DB_ID}`,
  `pwd=${process.env.DB_PASSWORD}`,
  `Naming=1`,
  `DBQ=,${process.env[`DB_DBQ`] ? process.env[`DB_DBQ`] : `*USRLIBL`}`,
  `CCSID=1208`,
  // `connectionTimeout: 1,`
].join(`;`);