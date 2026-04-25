import {
  makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, uintCV, stringAsciiCV, mnemonicToStxPrivKey
} from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import fetch from 'node-fetch';

// DATOS HARDCODEADOS - Si esto falla, el problema es de Railway no actualizando el archivo
const SEMILLA = "brown weird curve old found clog super vendor pen keep size giant";
const DIRECCION = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";
const CONTRATO_NOMBRE = 'onchainkms-stacks';
const CONTRATO_ADDRESS = 'SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH';

// Cambiamos a HIRO que no da el error EPROTO de SSL
const network = new StacksMainnet({ url: 'https://api.mainnet.hiro.so' });

async function iniciar() {
  console.log("!!! BOT ARRANCANDO !!!");
  console.log("Usando direccion:", DIRECCION);

  try {
    const privKey = await mnemonicToStxPrivKey(SEMILLA);
    
    // Peticion de Nonce
    const response = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${DIRECCION}?proof=0`);
    const data = await response.json();
    let nonce = data.nonce || 0;
    
    console.log("Nonce obtenido:", nonce);

    while (true) {
      try {
        const txOptions = {
          contractAddress: CONTRATO_ADDRESS,
          contractName: CONTRATO_NOMBRE,
          functionName: 'mint-activity',
          functionArgs: [stringAsciiCV("run"), uintCV(1), uintCV(1), uintCV(1), uintCV(1)],
          senderKey: privKey,
          nonce: nonce,
          fee: 10000,
          network: network,
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow
        };

        const tx = await makeContractCall(txOptions);
        const result = await broadcastTransaction(tx);
        
        console.log(`RESULTADO: Nonce ${nonce} ->`, result.txid || result.error || result);
        
        nonce++;
        await new Promise(r => setTimeout(r, 20000));
      } catch (err) {
        console.error("Error en bucle:", err.message);
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  } catch (e) {
    console.error("ERROR AL INICIAR:", e.message);
  }
}

iniciar();
