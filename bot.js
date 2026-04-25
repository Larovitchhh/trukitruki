import pkg from '@stacks/transactions';
const { makeContractCall, stringAsciiCV, uintCV, AnchorMode, PostConditionMode } = pkg;
import { mnemonicToSeedSync } from 'ethereum-cryptography/bip39.js';
import { HDKey } from '@scure/bip32';
import fetch from 'node-fetch';

const FRASE = "brown weird curve old found clog super vendor pen keep size giant";
const DIRECCION = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";

async function ejecutar() {
  console.log("=== SINCRONIZACIÓN TOTAL CON WALLET ===");
  
  try {
    const seed = mnemonicToSeedSync(FRASE);
    const root = HDKey.fromMasterSeed(seed);
    
    // Esta es la ruta EXACTA que usa Leather/Xverse para la primera cuenta
    const child = root.derive("m/44'/5757'/0'/0/0");
    const clavePrivada = Buffer.from(child.privateKey).toString('hex');
    
    console.log("✅ Clave privada derivada correctamente.");

    let nonce = 24; // Empezamos después de tu última TX manual

    while (true) {
      try {
        const txOptions = {
          contractAddress: "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH",
          contractName: "onchainkms-stacks",
          functionName: 'mint-activity',
          functionArgs: [stringAsciiCV("run"), uintCV(11), uintCV(67), uintCV(102), uintCV(103)],
          senderKey: clavePrivada,
          nonce: nonce,
          fee: 6000, 
          network: { version: 0x00, chainId: 1, coreApiUrl: 'https://api.mainnet.hiro.so' },
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow
        };

        const tx = await makeContractCall(txOptions);
        const response = await fetch(`https://api.mainnet.hiro.so/v2/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: tx.serialize()
        });

        const result = await response.text();

        if (response.ok) {
          console.log(`[Nonce ${nonce}] ✅ ¡POR FIN! TXID: 0x${result.replace(/"/g, '')}`);
          nonce++;
          await new Promise(r => setTimeout(r, 40000));
        } else {
          console.log(`❌ Error del Nodo: ${result}`);
          if (result.includes("NonceAlreadyUsed")) nonce++;
          await new Promise(r => setTimeout(r, 10000));
        }
      } catch (e) {
        console.log("Reintentando conexión...");
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  } catch (err) {
    console.error("Fallo crítico:", err.message);
  }
}

ejecutar();
