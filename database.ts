import sql from "npm:mssql";
import { logger, sleep, Walo } from "./utils.ts";

class Database {
  private pool: sql.ConnectionPool | null = null;
  private connected: boolean = false;
  private config: sql.config;
  public server: string;;

  constructor(server: string) {
    this.server = server;
    this.config = {
      user: "bizerba",
      password: "desio172",
      server: server || "localhost",
      database: "MultiTraceConnect",
      options: {
        encrypt: false,
        trustServerCertificate: true,
      },
    };
  }

  async connect(): Promise<void> {
    while (!this.connected) {
      try {
        this.pool = await new sql.ConnectionPool(this.config).connect();
        logger.success(`[${this.server}] ✅ Connesso al database`);  
        this.connected = true;
      } catch (err) {
        logger.error(`[${this.server}] ❌ Errore di connessione al db: ${err} `);
        this.connected = false;
      }
      await sleep(2);
    }
  }

  async findById(id: string): Promise<Walo | null> {
    if (!this.pool) return null;
    try {
      const res = await this.pool
        .request()
        .query(`SELECT * FROM PLU WHERE ID = ${id}`);
      return res.recordset;
    } catch (err) {
      logger.error(`[${this.server}] ❌ Errore in findById: ${err}`);
      return null;

    }
  }

  async updateById({ID, PREZZO, TESTO1}:Walo): Promise<void> {
    if (!this.pool) return;
    try {
      logger.info(`[${this.server}] 🔄 Aggiornamento ID ${ID}: ${TESTO1}, ${PREZZO}`);

      const numericId = typeof ID === "string" ? parseInt(ID, 10) : ID;

      const transaction = new sql.Transaction(this.pool);
      await transaction.begin();
      const request = new sql.Request(transaction);

      const result = await request.query(`
        UPDATE PLU
        SET TESTO1 = '${TESTO1}', PREZZO = ${PREZZO}, WALO = 1, FLAG_VAR = 1
        WHERE ID = ${numericId}
      `);

      if (result.rowsAffected[0]) {
        await transaction.commit();
        logger.success(`[${this.server}] ✅ Aggiornamento completato con successo`);
      } else {
        await transaction.rollback();
        logger.info(`[${this.server}] ⚠️ Nessuna riga aggiornata, rollback eseguito`);
      }
    } catch (err) {
      logger.error(`[${this.server}] ❌ Errore in updateById: ${err}`);
    }
  }

  async stopById(id: string): Promise<void> {
    if (!this.pool) return;
    try {
      logger.info(`[${this.server}] 🛑 Fermando ID ${id}`);

      const numericId = typeof id === "string" ? parseInt(id, 10) : id;

      const transaction = new sql.Transaction(this.pool);
      await transaction.begin();
      const request = new sql.Request(transaction);

      const result = await request.query(`
        UPDATE PLU
        SET WALO = 0, FLAG_VAR = 0
        WHERE ID = ${numericId}
      `);

      if (result.rowsAffected[0]) {
        await transaction.commit();
        logger.success(`[${this.server}] ✅ Arresto completato con successo`);
      } else {
        await transaction.rollback();
        logger.info(`[${this.server}] ⚠️ Nessuna riga modificata, rollback eseguito`);
      }
    } catch (err) {
      logger.error(`[${this.server}] ❌ Errore in stopById: ${err}`);
    }
  }

  async getWalos():Promise<Walo[] | null> {

    try {
      const walos = await this.pool
        .query("SELECT * FROM PLU WHERE WALO = 1");
      
      return walos.recordset;
    } catch (err) {
      logger.error(`[${this.server}] ❌ Errore di connessione: ${err}`);
      return null;
    }
  }
}

export default Database;
