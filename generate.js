import { mnemonicToStxPrivKey } from '@stacks/transactions';

// PEGA AQUÍ TUS 12 PALABRAS
const mnemonic = "tu semilla aqui de doce palabras"; 

async function ver() {
  const pk = await mnemonicToStxPrivKey(mnemonic);
  console.log("---------------------------------------");
  console.log("TU CLAVE PRIVADA ES:", pk);
  console.log("---------------------------------------");
}
ver();
