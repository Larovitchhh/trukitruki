import {
  makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, uintCV, stringAsciiCV, mnemonicToStxPrivKey
} from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import fetch from 'node-fetch';

// DATOS REALES DIRECTOS
const MI_FRASE = "brown weird curve old found clog super vendor pen keep size giant";
const MI_DIRECCION_STX = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";
const MI_CONTRATO = "onchainkms-stacks";
const DIRECCION_DEL_CONTRATO = "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH";

// Usamos el nodo de Hiro para saltar el error EPROTO (SSL 40)
const redStacks = new StacksMainnet({ url: 'https://api.mainnet.hiro.so' });

async function ejecutarBot() {
  console.log("=== ARRANCANDO BOT FORZADO ===");
  
  try {
    const clavePrivada = await mnemonicToStxPrivKey(MI_FRASE);
    
    // Si esta linea falla con "undefined", es que Railway NO esta usando este archivo
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
          fee: 12000,
          network: redStacks,
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow
        };

        const tx = await makeContractCall(opciones);
        const envio = await broadcastTransaction(tx);
        
        console.log(`Nonce ${miNonce} -> Resultado:`, envio.txid || envio.error);
        
        miNonce++;
        await new Promise(r => setTimeout(r, 25000));
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
