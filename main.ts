import { filterWalos, sleep, logger, Blacklisted, Walo } from "./utils.ts";

import Database from "./database.ts";

const args = Deno.args;
const makeBlacklist =
  (args.length >= 1 && parseInt(args[2]) == 1) || args.length == 2;
const BLACKLIST_CHECK_RATE_SECS = 11;
const MAIN_CYCLE_REFRESH_RATE_SECS = 15;
const temporaryBlacklisted: Blacklisted[] = [];

const external = new Database("10.150.126.98");
const local = new Database("localhost");

async function main() {
  try {
    logger.info(`make blacklist : ${makeBlacklist}`);

    await external.connect();
    await local.connect();

    // const walos:Walo[] | null = await external.getWalos();
    // const ids = walos!.map((x: Walo) => x.ID);

    // if (makeBlacklist) {
    // createBlacklist(ids); // ! da decommentare
    // }
    // await sleep(5);

    setInterval(blacklistCheck, BLACKLIST_CHECK_RATE_SECS * 1000);

    while (true) {
      const changed: Walo[] | null = await external.getWalos()!;
      const oks: Walo[] = filterWalos(changed!);

      for (const item of oks) {
        const { ID } = item;
        const found: Walo | null = await local.findById(ID);

        if (found) {
          // ! se non si trova nalla blacklist si inserisce
          // ! se si trova si aggiorna again
          if (!temporaryBlacklisted.find((x) => x.ID == ID)) {
            await local.updateById(item);
            temporaryBlacklisted.push({
              time: +new Date(),
              ID: ID,
              again: 0,
            });
          } else {
            temporaryBlacklisted.find((x) => x.ID == ID)!.again++; // SE LO TROVA ANCORA LO INCRENENTA
          }
        }
      }
      await sleep(MAIN_CYCLE_REFRESH_RATE_SECS);
    }
  } catch (err) {
    logger.error(err);
  }
}

main();

async function blacklistCheck() {
  // const currentTime: number = +new Date();

  // ! Controllo degli elementi nella lista ogni 5 secondi
  for (let i :number= 0; i< temporaryBlacklisted.length; i++) {
    const x = temporaryBlacklisted[i];

    // const elapsedTime: number = (currentTime - +new Date(x.time)) / 1000; // in secondi
    // if (elapsedTime >= 30) {
    //   await local.stopById(x.ID);

    // }
    if (x.again > 5) {
      // ! se lo trova più di 5 volte lo droppa anche dal server principale
      await external.stopById(x.ID);
      await local.stopById(x.ID);
      temporaryBlacklisted.splice(i, 1); // Rimuove l'elemento dalla lista
    }
  }

  // ! Rimuovi gli elementi che sono più vecchi di 1 minuto
  // temporaryBlacklisted = temporaryBlacklisted.filter((item) => {
  //   const elapsedTime = (currentTime - +new Date(item.time)) / 1000; // in secondi

  //   return elapsedTime < 30; // Mantieni solo quelli che sono stati aggiunti meno di 1 minuto fa
  // });
  logger.info(`Temporary Blacklisted: ${temporaryBlacklisted}`);
}
