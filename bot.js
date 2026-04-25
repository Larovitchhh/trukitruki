import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const StacksTx = require('@stacks/transactions');
const StacksNet = require('@stacks/network');
const fetch = require('node-fetch');

// Estos datos son los tuyos
const MI_FRASE = "brown weird curve old found clog super vendor pen keep size giant";
const MI_DIRECCION_STX = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";
const MI_CONTRATO = "onchainkms-stacks";
const DIRECCION_DEL_CONTRATO = "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH";

const redStacks = new StacksNet.StacksMainnet({ url: 'https://api.mainnet.hiro.so' });

async function ejecutarBot() {
  console.log("=== INTENTO DEFINITIVO: MODO COMPATIBILIDAD TOTAL ===");
  
  try {
    // Intentamos importar la función de derivación directamente desde el subpaquete
    // Si no está en StacksTx, la buscamos en el espacio global de Stacks
    let clavePrivada;
    try {
        // En algunas versiones está aquí
        clavePrivada = await StacksTx.mnemonicToStxPrivKey(MI_FRASE);
    } catch (e) {
        // Si no, usamos este método que es infalible si la librería está instalada
        const { mnemonicToStxPrivKey } = require('@stacks/transactions');
        clavePrivada = await mnemonicToStxPrivKey(MI_FRASE);
    }

    console.log("✅ Clave privada obtenida.");

    const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${MI_DIRECCION_STX}?proof=0`);
    const cuenta = await res.json();
    let miNonce = cuenta.nonce || 0;
    
    console.log("✅ Nonce inicial:", miNonce);

    while (true) {
      try {
        const txOptions = {
          contractAddress: DIRECCION_DEL_CONTRATO,
          contractName: MI_CONTRATO,
          functionName: 'mint-activity',
          functionArgs: [
            StacksTx.stringAsciiCV("run"),
            StacksTx.uintCV(11),
            StacksTx.uintCV(67),
            StacksTx.uintCV(102),
            StacksTx.uintCV(103)
          ],
          senderKey: clavePrivada,
          nonce: miNonce,
          fee: 25000, 
          network: redStacks,
          anchorMode: 1, // Any
          postConditionMode: 0x01 // Allow
        };

        const tx = await StacksTx.makeContractCall(txOptions);
        const envio = await StacksTx.broadcastTransaction(tx);
        
        console.log(`[Nonce ${miNonce}] TXID:`, envio.txid || envio.error);
        
        if (envio.txid || (envio.error && envio.error.includes("NonceAlreadyUsed"))) {
          miNonce++;
        }
        
        await new Promise(r => setTimeout(r, 25000));
      } catch (err) {
        console.error("❌ Error en envio:", err.message);
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  } catch (e) {
    console.error("❌ ERROR CRÍTICO FINAL:", e.message);
    console.log("Si ves esto, Railway está instalando una versión incompatible. Cambia el package.json.");
  }
}

ejecutarBot();
