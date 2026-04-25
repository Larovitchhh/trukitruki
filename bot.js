import pkg from '@stacks/transactions';
const { makeContractCall, broadcastTransaction, stringAsciiCV, uintCV } = pkg;
import { StacksMainnet } from '@stacks/network';
import fetch from 'node-fetch';

const FRASE = "brown weird curve old found clog super vendor pen keep size giant";
const DIRECCION = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";
const red = new StacksMainnet({ url: 'https://api.mainnet.hiro.so' });

async function ejecutar() {
  console.log("=== INTENTO CON FUNCIONES DISPONIBLES EN TU LOG ===");
  
  try {
    // Usamos una ruta alternativa que suele estar disponible cuando la principal falla
    const { mnemonicToStxPrivKey } = await import('@stacks/transactions/dist/index.js');
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
          fee: 55000, 
          network: red,
          anchorMode: 1,
          postConditionMode: 0x01
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
    console.error("❌ ERROR CRÍTICO:", err.message);
    console.log("Prueba a añadir 'engines': { 'node': '20.x' } en tu package.json");
  }
}

ejecutar();
