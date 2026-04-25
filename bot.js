import pkg from '@stacks/transactions';
import netPkg from '@stacks/network';
import fetch from 'node-fetch';

const { 
  mnemonicToStxPrivKey, 
  makeContractCall, 
  broadcastTransaction, 
  uintCV, 
  stringAsciiCV,
  AnchorMode,
  PostConditionMode
} = pkg;

const { StacksMainnet } = netPkg;

const FRASE = "brown weird curve old found clog super vendor pen keep size giant";
const DIRECCION = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";
const red = new StacksMainnet({ url: 'https://api.mainnet.hiro.so' });

async function ejecutar() {
  console.log("=== ARRANCANDO BOT (REESCRITURA TOTAL) ===");
  
  try {
    // Validamos la función antes de seguir
    if (typeof mnemonicToStxPrivKey !== 'function') {
        throw new Error("La función mnemonicToStxPrivKey no está disponible en este paquete.");
    }

    const clavePrivada = await mnemonicToStxPrivKey(FRASE);
    console.log("✅ Clave generada.");

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
          fee: 65000, 
          network: red,
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow
        };

        const tx = await makeContractCall(txOptions);
        const result = await broadcastTransaction(tx);
        
        console.log(`[Nonce ${nonce}] Resultado:`, result.txid || result.error);
        
        if (result.txid || JSON.stringify(result).includes("Nonce")) {
          nonce++;
        }
        
        await new Promise(r => setTimeout(r, 20000));
      } catch (err) {
        console.log("Error en bucle:", err.message);
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  } catch (err) {
    console.error("❌ ERROR CRÍTICO:", err.message);
  }
}

ejecutar();
