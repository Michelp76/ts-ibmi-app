import odbc from "odbc";

export default class {
  private static pool: odbc.Pool;

  static async connect(connectionString: string) {
    this.pool = await odbc.pool(connectionString);
  }

  /**
   * @throws Will crash if query is invalid
   */
  /*
  static query<T>(statement: string, bindingsValues: (number|string)[] = []): Promise<T[]> {
    return this.pool.query(statement, bindingsValues) as Promise<T[]>;
  }
  */
  static async query<T>(statement: string, bindingsValues: (number|string)[] = []) {
    return this.pool.query(statement, bindingsValues);
  }

  static async callProcedure<T>(catalog: string|null, library: string, procedure: string, bindingsValues: (number|string)[] = []) {
    const connection = await this.pool.connect();
    return connection.callProcedure(catalog, library, procedure, bindingsValues);
  }
}

export const connectionString = [
  `DSN=DEVPAIS`,
  `UID=${process.env.DB_ID}`,
  `PWD=${process.env.DB_PASSWORD}`
].join(`;`);

// Ne fonctionne pas comme ça :/
// export const connectionString = [
//   `DRIVER={Client Access ODBC Driver (32-bit)}`,
//   `SYSTEM=${process.env.DB_HOST}`,
//   `uid=${process.env.DB_ID}`,
//   `pwd=${process.env.DB_PASSWORD}`,
//   `Naming=1`,
//   `DBQ=,${process.env[`DB_DBQ`] ? process.env[`DB_DBQ`] : `*USRLIBL`}`,
// ].join(`;`);