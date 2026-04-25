import {
  makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, uintCV, stringAsciiCV, mnemonicToStxPrivKey
} from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import fetch from 'node-fetch';

// --- CONFIGURACIÓN DIRECTA (Pon tus datos aquí para evitar errores de variables) ---
const MI_SEMILLA = "brown weird curve old found clog super vendor pen keep size giant"; 
const MI_DIRECCION = "TU_DIRECCION_SP_AQUI"; 
// ----------------------------------------------------------------------------------

const CONTRACT_ADDRESS = 'SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH';
const CONTRACT_NAME = 'onchainkms-stacks';
const network = new StacksMainnet({ url: 'https://api.mainnet.hiro.so' });

async function run() {
  try {
    // 1. Derivamos la clave privada de la semilla directamente para no depender de Railway
    const privKey = await mnemonicToStxPrivKey(MI_SEMILLA);
    console.log("Clave privada cargada correctamente.");

    // 2. Obtenemos el Nonce (usando el nodo de Hiro que es más estable)
    const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${MI_DIRECCION}?proof=0`);
    const accountData = await res.json();
    let nonce = accountData.nonce;
    console.log("Nonce actual:", nonce);

    while (true) {
      try {
        const txOptions = {
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'mint-activity',
          functionArgs: [stringAsciiCV("run"), uintCV(1), uintCV(1), uintCV(1), uintCV(1)],
          senderKey: privKey,
          nonce: nonce,
          fee: 5000,
          network: network,
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow
        };

        const tx = await makeContractCall(txOptions);
        const result = await broadcastTransaction(tx);
        
        console.log(`TX enviada | Nonce: ${nonce} | Resultado:`, result.txid || result.error);
        
        nonce++;
        await new Promise(r => setTimeout(r, 15000)); // Espera 15 seg
      } catch (innerError) {
        console.error("Error en envío:", innerError.message);
        await new Promise(r => setTimeout(r, 30000));
      }
    }
  } catch (e) {
    console.error("Fallo al iniciar:", e.message);
  }
}

run();
