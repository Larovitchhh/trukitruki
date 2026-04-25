import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const StacksTx = require('@stacks/transactions');
const StacksNet = require('@stacks/network');
const fetch = require('node-fetch');

// Frase limpia y directa
const MI_FRASE = "brown weird curve old found clog super vendor pen keep size giant";

const MI_DIRECCION_STX = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";
const MI_CONTRATO = "onchainkms-stacks";
const DIRECCION_DEL_CONTRATO = "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH";

const redStacks = new StacksNet.StacksMainnet({ url: 'https://api.mainnet.hiro.so' });

async function ejecutarBot() {
  console.log("=== LANZAMIENTO FORZADO ===");
  
  try {
    // Usamos la función de derivación que SIEMPRE está en @stacks/transactions
    // pero accedemos a ella de forma segura
    const clavePrivada = await StacksTx.mnemonicToStxPrivKey(MI_FRASE);
    
    console.log("✅ Clave privada generada.");

    const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${MI_DIRECCION_STX}?proof=0`);
    const cuenta = await res.json();
    let miNonce = cuenta.nonce || 0;
    
    console.log("✅ Nonce actual:", miNonce);

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
          fee: 40000, 
          network: redStacks,
          anchorMode: 1, 
          postConditionMode: 0x01
        };

        const tx = await StacksTx.makeContractCall(txOptions);
        const envio = await StacksTx.broadcastTransaction(tx);
        
        console.log(`[Nonce ${miNonce}] TX Enviada:`, envio.txid || envio.error);
        
        // Si hay éxito o el nonce ya se usó, saltamos al siguiente
        if (envio.txid || (envio.error && JSON.stringify(envio.error).includes("Nonce"))) {
          miNonce++;
        }
        
        await new Promise(r => setTimeout(r, 20000));
      } catch (err) {
        console.error("❌ Error en transaccion:", err.message);
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  } catch (e) {
    console.error("❌ ERROR CRÍTICO:", e.message);
  }
}

ejecutarBot();
