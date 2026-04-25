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
  console.log("=== DIAGNÓSTICO DE ARRANQUE ===");
  
  try {
    console.log("1. Derivando clave...");
    const clavePrivada = await mnemonicToStxPrivKey(FRASE);
    console.log("✅ Clave lista.");

    console.log(`2. Consultando API de Hiro para: ${DIRECCION}...`);
    
    // Añadimos un controlador de tiempo para que no se quede colgado eternamente
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${DIRECCION}?proof=0`, {
        signal: controller.signal
    }).finally(() => clearTimeout(timeout));

    if (!res.ok) throw new Error(`Error API Hiro: ${res.statusText}`);
    
    const data = await res.json();
    let nonce = data.nonce || 0;
    console.log("✅ Nonce obtenido:", nonce);

    console.log("3. Entrando en bucle de minteo...");

    while (true) {
      try {
        console.log(`> Intentando mintear con Nonce: ${nonce}...`);
        
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
          fee: 70000, 
          network: red,
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow
        };

        const tx = await makeContractCall(txOptions);
        const result = await broadcastTransaction(tx);
        
        console.log(`[Resultado] TXID: ${result.txid || 'Error'} | Detalle: ${JSON.stringify(result)}`);
        
        if (result.txid || JSON.stringify(result).includes("NonceAlreadyUsed")) {
          nonce++;
        }
        
        console.log("Esperando 20s para el siguiente...");
        await new Promise(r => setTimeout(r, 20000));
      } catch (err) {
        console.log("⚠️ Error en el intento:", err.message);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  } catch (err) {
    console.error("❌ ERROR CRÍTICO:", err.message);
  }
}

ejecutar();
