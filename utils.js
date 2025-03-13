// Importazioni con require
import { writeFileSync, readFileSync, appendFileSync } from 'node:fs';
import chalk from 'npm:chalk';

export function createBlacklist(lista) {
    writeFileSync("blacklist.txt", `${lista.join(',')}`);
}

let firstTime = true;
let blacklist = [];
export function filterWalos(lista) {
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

export function sleep(seconds) {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

const getTimestamp = () => new Date().toLocaleString();


export class logger {
    static info(message) {
      console.log(
        chalk.white.bold(`${getTimestamp()} [INFO]  - `, logger.formatMessage(message)) +
          chalk.reset()
      )
    }
  
    static error(message) {
      const errorMessage = `${getTimestamp()} [ERROR] - ${logger.formatMessage(message)}\n`
      console.log(chalk.red.bold(errorMessage) + chalk.reset())
      }
  
    static success(message) {
      console.log(
        chalk.green.bold(`${getTimestamp()} [SUCCESS] - `, logger.formatMessage(message)) +
          chalk.reset()
      )
    }
    
  static formatMessage(message) {
    return typeof message === 'string' ? message : JSON.stringify(message, null, 2)
  }
}