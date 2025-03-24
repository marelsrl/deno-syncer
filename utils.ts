// Importazioni con require
import { writeFileSync, readFileSync } from 'node:fs';
import chalk from 'npm:chalk';

export function createBlacklist(lista:string[]) {
    writeFileSync("blacklist.txt", `${lista.join(',')}`);
}

let firstTime = true;
let blacklist:string[] = [];

export function filterWalos(lista:Walo[]):Walo[] {
    if(!firstTime){
        return lista.filter(item => !blacklist.includes(item.ID));
    }else{
        const values = readFileSync("blacklist.txt", "utf8");
        const blacklisted = values.split(",").map(item => item.toString().trim());
        blacklist = [...blacklisted];
        firstTime = false;
        return lista.filter(item => !blacklisted.includes(item.ID));
    }


}

export function sleep(seconds:number) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

const getTimestamp = () => new Date().toLocaleString();


export class logger {
  // deno-lint-ignore no-explicit-any
    static info(message:any) {
      console.log(
        chalk.white.bold(`${getTimestamp()} [INFO]  - `, logger.formatMessage(message)) +
          chalk.reset()
      )
    }
  // deno-lint-ignore no-explicit-any
    static error(message:any) {
      const errorMessage = `${getTimestamp()} [ERROR] - ${logger.formatMessage(message)}\n`
      console.log(chalk.red.bold(errorMessage) + chalk.reset())
      }
  // deno-lint-ignore no-explicit-any
    static success(message:any) {
      console.log(
        chalk.green.bold(`${getTimestamp()} [SUCCESS] - `, logger.formatMessage(message)) +
          chalk.reset()
      )
    }
    
  // deno-lint-ignore no-explicit-any
  static formatMessage(message:any) {
    return typeof message === 'string' ? message : JSON.stringify(message, null, 2)
  }
}


export interface Blacklisted {
    ID: string;
    time: number;
    again:number;
}

export interface Walo {
    ID: string;
    TESTO1:string
     PREZZO:string
}