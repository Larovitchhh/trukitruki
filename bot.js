import pkg from '@stacks/transactions';
const { makeContractCall, broadcastTransaction, stringAsciiCV, uintCV } = pkg;
import { StacksMainnet } from '@stacks/network';
import fetch from 'node-fetch';

// Tu semilla y dirección
const FRASE = "brown weird curve old found clog super vendor pen keep size giant";
const DIRECCION = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";

// Nodo de Hiro
const red = new StacksMainnet({ url: 'https://api.mainnet.hiro.so' });

async function ejecutar() {
  console.log("=== EJECUCIÓN FINAL SIN DEPENDENCIAS DE CLAVE ===");
  
  try {
    // IMPORTANTE: Si la función falla, usamos el backup manual
    let clavePrivada;
    try {
        // Intentamos el método estándar de la librería que Railway tiene instalada
        const { mnemonicToStxPrivKey } = await import('@stacks/transactions');
        clavePrivada = await mnemonicToStxPrivKey(FRASE);
    } catch (e) {
        // Si falla (como antes), el bot morirá aquí con un mensaje claro
        throw new Error("La librería de Stacks en Railway no es compatible con Node 22. Error: " + e.message);
    }

    console.log("✅ Clave generada. Obteniendo Nonce...");

    const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${DIRECCION}?proof=0`);
    const data = await res.json();
    let nonce = data.nonce || 0;

    console.log("✅ Nonce inicial:", nonce);

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
          fee: 50000, 
          network: red,
          anchorMode: 1, // Any
          postConditionMode: 0x01 // Allow
        };

        const tx = await makeContractCall(txOptions);
        const result = await broadcastTransaction(tx);
        
        console.log(`[Nonce ${nonce}] TX:`, result.txid || result.error);
        
        if (result.txid || JSON.stringify(result).includes("Nonce")) {
          nonce++;
        }
        
        await new Promise(r => setTimeout(r, 20000));
      } catch (err) {
        console.log("Reintentando... Error:", err.message);
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  } catch (err) {
    console.error("❌ ERROR FATAL:", err.message);
  }
}

ejecutar();
