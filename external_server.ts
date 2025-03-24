import sql from 'npm:mssql';
import { logger, sleep, Walo } from './utils.ts';


let externalPool:sql.ConnectionPool;

let connected = false;
export async function connectExteralServer(server:string) {
  const config = {
    user: "bizerba",
    password: "desio172",
    server: server || "localhost",
    database: "MultiTraceConnect",
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };

  while(!connected){
    logger.info("trying to connect to external server...");
    
    try{
      externalPool  = await new sql.ConnectionPool(config).connect();
      logger.success("✅ Connesso al database esterno");
      connected = true;
    }catch(err){
      connected = false;
      logger.error("Errore di connessione al databas esterno");
    }
    await sleep(2);
  }

  
}

export async function getWalos():Promise<Walo[] | null> {
  try {
    const walos = await externalPool
      .request()
      .query("SELECT * FROM PLU WHERE WALO = 1");
    
    return walos.recordset;
  } catch (err) {
    logger.error(`❌ Errore di connessione: ${err}`);

    return null;
  }
}

