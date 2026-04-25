import pkg from '@stacks/transactions';
const { makeContractCall, broadcastTransaction, stringAsciiCV, uintCV, AnchorMode, PostConditionMode } = pkg;
import { mnemonicToSeedSync } from 'ethereum-cryptography/bip39.js';
import { HDKey } from 'ethereum-cryptography/hdkey.js';
import fetch from 'node-fetch';

const FRASE = "brown weird curve old found clog super vendor pen keep size giant";
const DIRECCION = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";

async function ejecutar() {
  console.log("=== LANZAMIENTO (COMPATIBILIDAD DE RED) ===");
  
  try {
    const seed = mnemonicToSeedSync(FRASE);
    const hdkey = HDKey.fromMasterSeed(seed);
    const child = hdkey.derive("m/44'/5757'/0'/0/0");
    const clavePrivada = Buffer.from(child.privateKey).toString('hex');
    
    console.log("✅ Clave privada lista.");

    // Formato de red ultra-específico para evitar el error de "Invalid network name"
    const red = {
      version: 0x00, // Representa Mainnet en esta versión de la lib
      chainId: 1,
      coreApiUrl: 'https://api.mainnet.hiro.so'
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
          fee: 150000, // 0.15 STX para asegurar prioridad
          network: red,
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow
        };

        const tx = await makeContractCall(txOptions);
        const result = await broadcastTransaction(tx);
        
        if (result.txid) {
            console.log(`[Nonce ${nonce}] ✅ ENVIADA! TXID: ${result.txid}`);
            nonce++;
        } else {
            console.log(`[Nonce ${nonce}] ⚠️ Respuesta: ${JSON.stringify(result)}`);
            if (JSON.stringify(result).includes("NonceAlreadyUsed")) nonce++;
        }
        
        await new Promise(r => setTimeout(r, 25000));
      } catch (err) {
        // Si el error de red persiste, intentamos un último cambio en caliente
        if (err.message.includes("network name")) {
            red.version = "mainnet"; // Último recurso si el código numérico falla
            console.log("Cambiando modo de red a string...");
        }
        console.log("⚠️ Error:", err.message);
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  } catch (err) {
    console.error("❌ ERROR CRÍTICO:", err.message);
  }
}

ejecutar();
