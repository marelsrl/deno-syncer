import sql from 'npm:mssql';
import { logger, sleep } from './utils.ts';



let localPool:sql.ConnectionPool;
let connected = false;

export async function connectLocalServer() {
  const config = {
    user: "bizerba",
    password: "desio172",
    server: "localhost",
    database: "MultiTraceConnect",
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };

  while(!connected){

    try{
      localPool = await new sql.ConnectionPool(config).connect();
      logger.success("✅ Connesso al database locale");
      connected = true;
    }catch(err){
      logger.error("errore di connessione al db locale");
      connected = false;
    }

    await sleep(2);
  }

}

export async function findById( id:string) {
  try {
    const res = await localPool
      .request()
      .query(`SELECT * FROM PLU WHERE ID = ${id}`);
    return res.recordset;
  } catch (err) {
    logger.error(`❌ Errore in findById: ${err}`);
  }
}

export async function updateById( id:string, title:string, price:string) {
  try {
    logger.info(`🔄 Aggiornamento ID ${id}: ${title}, ${price}`);

    const numericId = typeof id === "string" ? parseInt(id, 10) : id;

    // Creazione di una transazione
    const transaction = new sql.Transaction(localPool);
    await transaction.begin();
    const request = new sql.Request(transaction);

    const result = await request.query(`
      UPDATE PLU
      SET TESTO1 = '${title}', PREZZO = ${price}, WALO = 1, FLAG_VAR = 1
      WHERE ID = ${numericId}
    `);

    if (result.rowsAffected[0]) {
      await transaction.commit();
      logger.success("✅ Aggiornamento completato con successo");
    } else {
      await transaction.rollback();
      logger.info("⚠️ Nessuna riga aggiornata, rollback eseguito");
    }
  } catch (err) {
    logger.error(`❌ Errore in updateById: ${err}`);
  }
}

export async function stopById( id:string) {
  try {
    logger.info(`🛑 Fermando ID ${id}`);

    const numericId = typeof id === "string" ? parseInt(id, 10) : id;

    // Creazione di una transazione
    const transaction = new sql.Transaction(localPool);
    await transaction.begin();
    const request = new sql.Request(transaction);

    const result = await request.query(`
      UPDATE PLU
      SET WALO = 0, FLAG_VAR = 0
      WHERE ID = ${numericId}
    `);

    if (result.rowsAffected[0]) {
      await transaction.commit();
      logger.success("✅ Arresto completato con successo");
    } else {
      await transaction.rollback();
      logger.info("⚠️ Nessuna riga modificata, rollback eseguito");
    }
  } catch (err) {
    logger.error(`❌ Errore in stopById: ${err}`);
  }
}

