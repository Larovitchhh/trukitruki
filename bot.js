import { mnemonicToSeedSync } from 'ethereum-cryptography/bip39.js';
import { HDKey } from 'ethereum-cryptography/hdkey.js';
import pkg from '@stacks/transactions';
const { getAddressFromPrivateKey, TransactionVersion } = pkg;

const FRASE = "brown weird curve old found clog super vendor pen keep size giant";

console.log("=== BUSCADOR DE CLAVE PRIVADA ===");
const seed = mnemonicToSeedSync(FRASE);
const root = HDKey.fromMasterSeed(seed);

for (let i = 0; i < 5; i++) {
    const child = root.derive(`m/44'/5757'/0'/0/${i}`);
    // Probamos versión comprimida (añadiendo 01)
    const privHex = Buffer.from(child.privateKey).toString('hex') + "01";
    const addr = getAddressFromPrivateKey(privHex, TransactionVersion.Mainnet);
    
    console.log(`Cuenta #${i}:`);
    console.log(` > Dirección: ${addr}`);
    console.log(` > Clave Privada: ${privHex}`);
    console.log("-------------------");
}
