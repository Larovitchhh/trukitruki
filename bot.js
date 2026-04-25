import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Cargamos las librerías de la forma antigua para evitar errores de ESM
const StacksTx = require('@stacks/transactions');
const StacksNet = require('@stacks/network');
const fetch = require('node-fetch');

const MI_FRASE = "brown weird curve old found clog super vendor pen keep size giant";
const MI_DIRECCION_STX = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";
const MI_CONTRATO = "onchainkms-stacks";
const DIRECCION_DEL_CONTRATO = "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH";

const redStacks = new StacksNet.StacksMainnet({ url: 'https://api.mainnet.hiro.so' });

async function ejecutarBot() {
  console.log("=== ARRANCANDO BOT (MODO REQUERIDO) ===");
  
  try {
    // En las versiones que Railway está bajando, la función puede llamarse de estas dos formas
    const deriveFn = StacksTx.mnemonicToStxPrivKey || StacksTx.generatePrivateKeyFromMnemonic;
    
    if (!deriveFn) {
        console.log("Funciones disponibles en esta version:", Object.keys(StacksTx));
        throw new Error("No se encontro la funcion de clave privada");
    }

    const clavePrivada = await deriveFn(MI_FRASE);
    console.log("✅ Clave privada cargada.");

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
          anchorMode: StacksTx.AnchorMode.Any,
          postConditionMode: StacksTx.PostConditionMode.Allow
        };

        const tx = await StacksTx.makeContractCall(txOptions);
        const envio = await StacksTx.broadcastTransaction(tx);
        
        console.log(`[Nonce ${miNonce}] TXID:`, envio.txid || envio.error);
        
        if (envio.txid || envio.reason === "NonceAlreadyUsed") {
          miNonce++;
        }
        
        await new Promise(r => setTimeout(r, 30000));
      } catch (err) {
        console.error("❌ Error en envio:", err.message);
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  } catch (e) {
    console.error("❌ ERROR CRITICO:", e.message);
  }
}

ejecutarBot();
