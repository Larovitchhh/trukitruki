import {
  makeContractCall, 
  broadcastTransaction, 
  AnchorMode, 
  PostConditionMode, 
  uintCV, 
  stringAsciiCV, 
  mnemonicToStxPrivKey
} from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import fetch from 'node-fetch';

// Datos insertados directamente para evitar errores de variables
const SEMILLA = "brown weird curve old found clog super vendor pen keep size giant";
const DIRECCION = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";
const NOMBRE_CONTRATO = 'onchainkms-stacks'; 
const DIRECCION_CONTRATO = 'SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH';

// Nodo de Hiro (evita el error SSL alert 40 de Stacks)
const API_URL = 'https://api.mainnet.hiro.so'; 
const network = new StacksMainnet({ url: API_URL });

async function run() {
  console.log("--- INICIANDO BOT ---");
  console.log("Dirección:", DIRECCION);
  
  try {
    const privKey = await mnemonicToStxPrivKey(SEMILLA);
    
    // Obtenemos el nonce directamente
    const res = await fetch(`${API_URL}/v2/accounts/${DIRECCION}?proof=0`);
    const data = await res.json();
    let nonce = data.nonce;
    
    console.log("Conectado con éxito. Nonce actual:", nonce);

    while (true) {
      try {
        const txOptions = {
          contractAddress: DIRECCION_CONTRATO,
          contractName: NOMBRE_CONTRATO,
          functionName: 'mint-activity',
          functionArgs: [
            stringAsciiCV("run"),
            uintCV(1), uintCV(1), uintCV(1), uintCV(1)
          ],
          senderKey: privKey,
          nonce: nonce,
          fee: 10000, // Subido un poco para que entre rápido
          network: network,
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow
        };

        const tx = await makeContractCall(txOptions);
        const result = await broadcastTransaction(tx);
        
        if (result.error) {
          console.log(`Error en Nonce ${nonce}:`, result.error);
          // Si el error es por Nonce, intentamos actualizarlo
          if (result.reason === "NonceAlreadyUsed") {
            nonce++;
            continue;
          }
        } else {
          console.log(`TX enviada OK! Nonce: ${nonce} | TXID: ${result.txid}`);
          nonce++;
        }
        
        await new Promise(r => setTimeout(r, 25000));

      } catch (err) {
        console.error("Error en el envío, reintentando...", err.message);
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  } catch (e) {
    console.error("ERROR CRÍTICO:", e.message);
  }
}

run();
