import { mnemonicToStxPrivKey } from '@stacks/transactions';

// PEGA AQUÍ TUS 12 PALABRAS
const mnemonic = "brown weird curve old found clog super vendor pen keep size giant"; 

async function ver() {
  const pk = await mnemonicToStxPrivKey(mnemonic);
  console.log("---------------------------------------");
  console.log("TU CLAVE PRIVADA ES:", pk);
  console.log("---------------------------------------");
}
ver();
