import pkg from '@stacks/transactions';
const { makeContractCall, broadcastTransaction, stringAsciiCV, uintCV, AnchorMode, PostConditionMode } = pkg;
import { mnemonicToSeedSync } from 'ethereum-cryptography/bip39.js';
import { HDKey } from 'ethereum-cryptography/hdkey.js';
import fetch from 'node-fetch';

const FRASE = "brown weird curve old found clog super vendor pen keep size giant";
const DIRECCION = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";

async function ejecutar() {
  console.log("=== ENVIANDO TRANSACCIONES ===");
  
  try {
    // Generación manual de clave (ya comprobado que funciona)
    const seed = mnemonicToSeedSync(FRASE);
    const hdkey = HDKey.fromMasterSeed(seed);
    const child = hdkey.derive("m/44'/5757'/0'/0/0");
    const clavePrivada = Buffer.from(child.privateKey).toString('hex');
    
    console.log("✅ Clave privada lista.");

    // Definimos la red con el formato que exige la versión 6.x
    const red = {
      coreApiUrl: 'https://api.mainnet.hiro.so',
      chainId: 1,
      networkVersion: 1
    };

    const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${DIRECCION}?proof=0`);
    const data = await res.json();
    let nonce = data.nonce || 0;
    console.log("✅ Nonce actual:", nonce);

    while (true) {
      try {
        const txOptions = {
          contractAddress: "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH",
          contractName: "onchainkms-stacks",
          functionName: 'mint-activity',
          functionArgs: [
            stringAsciiCV("run"),
            uintCV(11),
            uintCV(67),
            uintCV(102),
            uintCV(103)
          ],
          senderKey: clavePrivada,
          nonce: nonce,
          fee: 120000, // Subido un poco más para prioridad
          network: red,
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow
        };

        const tx = await makeContractCall(txOptions);
        const result = await broadcastTransaction(tx);
        
        if (result.txid) {
            console.log(`[Nonce ${nonce}] ✅ ÉXITO! TXID: ${result.txid}`);
            nonce++;
        } else {
            const errorMsg = JSON.stringify(result);
            console.log(`[Nonce ${nonce}] ⚠️ Respuesta: ${errorMsg}`);
            
            if (errorMsg.includes("NonceAlreadyUsed")) {
                nonce++;
            }
        }
        
        console.log("Esperando 30s...");
        await new Promise(r => setTimeout(r, 30000));
      } catch (err) {
        console.log("⚠️ Error en bucle:", err.message);
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  } catch (err) {
    console.error("❌ ERROR CRÍTICO:", err.message);
  }
}

ejecutar();
