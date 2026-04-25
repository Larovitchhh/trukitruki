import pkg from '@stacks/transactions';
const { 
  makeContractCall, 
  broadcastTransaction, 
  AnchorMode, 
  PostConditionMode, 
  uintCV, 
  stringAsciiCV, 
  mnemonicToStxPrivKey 
} = pkg;

import { StacksMainnet } from '@stacks/network';
import fetch from 'node-fetch';

// DATOS HARDCODEADOS
const MI_FRASE = "brown weird curve old found clog super vendor pen keep size giant";
const MI_DIRECCION_STX = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";
const MI_CONTRATO = "onchainkms-stacks";
const DIRECCION_DEL_CONTRATO = "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH";

const redStacks = new StacksMainnet({ url: 'https://api.mainnet.hiro.so' });

async function ejecutarBot() {
  console.log("=== ARRANCANDO BOT (MODO COMPATIBLE) ===");
  
  try {
    // Generamos la clave
    const clavePrivada = await mnemonicToStxPrivKey(MI_FRASE);
    console.log("Clave privada generada.");

    // Obtenemos el Nonce
    const peticion = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${MI_DIRECCION_STX}?proof=0`);
    const cuenta = await peticion.json();
    let miNonce = cuenta.nonce || 0;
    
    console.log("Nonce inicial:", miNonce);

    while (true) {
      try {
        const opciones = {
          contractAddress: DIRECCION_DEL_CONTRATO,
          contractName: MI_CONTRATO,
          functionName: 'mint-activity',
          functionArgs: [stringAsciiCV("run"), uintCV(1), uintCV(1), uintCV(1), uintCV(1)],
          senderKey: clavePrivada,
          nonce: miNonce,
          fee: 15000, // Un poco más de gas para que no se quede atascada
          network: redStacks,
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow
        };

        const tx = await makeContractCall(opciones);
        const envio = await broadcastTransaction(tx);
        
        console.log(`Nonce ${miNonce} -> TXID:`, envio.txid || envio.error);
        
        miNonce++;
        // Esperamos 30 segundos (Stacks es lento, no satures el mempool)
        await new Promise(r => setTimeout(r, 30000));
      } catch (err) {
        console.error("Error en bucle:", err.message);
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  } catch (e) {
    console.error("ERROR CRITICO:", e.message);
  }
}

ejecutarBot();
