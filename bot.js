import { mnemonicToSeedSync } from 'ethereum-cryptography/bip39.js';
import { HDKey } from 'ethereum-cryptography/hdkey.js';
import pkg from '@stacks/transactions';
const { getAddressFromPrivateKey, TransactionVersion } = pkg;

const FRASE = "brown weird curve old found clog super vendor pen keep size giant";

async function buscar() {
  console.log("=== BUSCADOR DE LLAVES (MODO DIAGNÓSTICO) ===");
  const seed = mnemonicToSeedSync(FRASE);
  const root = HDKey.fromMasterSeed(seed);

  // Vamos a probar 10 rutas para estar seguros
  for (let i = 0; i < 10; i++) {
    const child = root.derive(`m/44'/5757'/0'/0/${i}`);
    const privHex = Buffer.from(child.privateKey).toString('hex') + "01";
    const addr = getAddressFromPrivateKey(privHex, TransactionVersion.Mainnet);
    
    console.log(`RUTA index ${i}:`);
    console.log(` > Dirección: ${addr}`);
    console.log(` > PRIVATE_KEY: ${privHex}`);
    console.log("-------------------");
  }
}
buscar();
