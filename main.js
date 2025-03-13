// Importazioni con require
import { connectExteralServer, getWalos } from "./external_server.js";
import { connectLocalServer, findById, updateById,stopById } from"./local_server.js";
import { filterWalos, sleep, createBlacklist, logger } from "./utils.js";


const args = process.argv;
const makeBlacklist = (args.length >= 1 && args[2] == 1) || args.length == 2;

async function main(){
  try{
    logger.info(`make blacklist : ${makeBlacklist}`);

    let temporaryBlacklisted = [];
  
    setInterval(async() => {
      const currentTime = new Date();
  
      // Controllo degli elementi nella lista ogni 5 secondi
      for(let x of temporaryBlacklisted){
        const elapsedTime = (currentTime - new Date(x.time)) / 1000; // in secondi
        if(elapsedTime >= 30){
          await stopById(x.ID)
        }
      }
      // Rimuovi gli elementi che sono più vecchi di 1 minuto
      temporaryBlacklisted = temporaryBlacklisted.filter( item => {
        
        const elapsedTime = (currentTime - new Date(item.time)) / 1000; // in secondi
       
        return elapsedTime < 30; // Mantieni solo quelli che sono stati aggiunti meno di 1 minuto fa
      });
      logger.info("Temporary Blacklisted:", temporaryBlacklisted);
    }, 11000);
  
    await connectExteralServer("10.150.126.98");
    await connectLocalServer();
  
    const walos = await  getWalos();
    const ids = walos.map(x=>x.ID);
  
    if(makeBlacklist){
      createBlacklist(ids); // ! da decommentare
    }
    await sleep(5);
  
  
    while(true){
      const changed = await getWalos()
      const oks = filterWalos(changed);
      
  
      for(let item of oks){
        const {ID,TESTO1, PREZZO} = item;
        const found = await findById(ID);
  
        if(found && !temporaryBlacklisted.find(x=>x.ID == ID)){
          //@ts-ignore
            await updateById(ID,TESTO1, PREZZO)
            temporaryBlacklisted.push({
              time:new Date(),
              ID:ID
            });
        }
      }
      await sleep(15);
    }
  

  }catch(err){
    logger.error(err?.message);

  }


}

main();
