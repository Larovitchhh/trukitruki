import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  stringAsciiCV
} from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import fetch from 'node-fetch';

const CONTRACT_ADDRESS = 'SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH';
const CONTRACT_NAME = 'onchainkms-stacks';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SENDER = process.env.SENDER;
// Usamos el nodo de Hiro que suele ser más estable
const API = 'https://api.mainnet.hiro.so'; 
const network = new StacksMainnet({ url: API });

async function getNonce(address) {
  if (!address) throw new Error("Falta la variable SENDER en Railway");
  try {
    const res = await fetch(`${API}/v2/accounts/${address}?proof=0`);
    const data = await res.json();
    return data.nonce;
  } catch (e) {
    console.error("Error obteniendo nonce:", e.message);
    return null;
  }
}

async function run() {
  console.log("Iniciando bot para:", SENDER);
  let nonce = await getNonce(SENDER);
  
  if (nonce === null) {
    console.log("No se pudo obtener el nonce inicial. Reintentando en 10s...");
    setTimeout(run, 10000);
    return;
  }

  while (true) {
    try {
      const txOptions = {
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'mint-activity',
        functionArgs: [
          stringAsciiCV("run"),
          uintCV(1),
          uintCV(1),
          uintCV(1),
          uintCV(1)
        ],
        senderKey: PRIVATE_KEY,
        nonce: nonce,
        fee: 5000, // Subido un poco para asegurar confirmación
        network: network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow
      };

      const tx = await makeContractCall(txOptions);
      const result = await broadcastTransaction(tx);

      if (result.error) {
        console.error(`Error en TX ${nonce}:`, result.error);
        if (result.reason === 'NonceAlreadyUsed') nonce++;
      } else {
        console.log(`TX enviada con Nonce ${nonce}. ID: ${result.txid}`);
        nonce++;
      }

      await new Promise(r => setTimeout(r, 5000)); // 5 seg entre envíos

    } catch (e) {
      console.error("Fallo catastrófico:", e.message);
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

run();
