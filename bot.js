import pkg from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import fetch from 'node-fetch';

// DATOS HARDCODEADOS
const MI_FRASE = "brown weird curve old found clog super vendor pen keep size giant";
const MI_DIRECCION_STX = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";
const MI_CONTRATO = "onchainkms-stacks";
const DIRECCION_DEL_CONTRATO = "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH";

const redStacks = new StacksMainnet({ url: 'https://api.mainnet.hiro.so' });

async function ejecutarBot() {
  console.log("=== ARRANCANDO BOT (REPARACIÓN FINAL) ===");
  
  try {
    // Buscamos la función de derivación donde sea que esté (pkg o pkg.default)
    const lib = pkg.default || pkg;
    const deriveFn = lib.mnemonicToStxPrivKey || lib.generatePrivateKeyFromMnemonic;
    
    if (!deriveFn) {
      console.log("Funciones disponibles:", Object.keys(lib));
      throw new Error("No se encontró la función de derivación.");
    }

    const clavePrivada = await deriveFn(MI_FRASE);
    console.log("Clave privada lista.");

    const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${MI_DIRECCION_STX}?proof=0`);
    const cuenta = await res.json();
    let miNonce = cuenta.nonce || 0;
    
    console.log("Nonce inicial:", miNonce);

    while (true) {
      try {
        const opciones = {
          contractAddress: DIRECCION_DEL_CONTRATO,
          contractName: MI_CONTRATO,
          functionName: 'mint-activity',
          functionArgs: [
            lib.stringAsciiCV("run"),   // activityType
            lib.uintCV(11),             // distance
            lib.uintCV(67),             // duration
            lib.uintCV(102),            // elevation
            lib.uintCV(103)             // xp
          ],
          senderKey: clavePrivada,
          nonce: miNonce,
          fee: 15000, 
          network: redStacks,
          anchorMode: lib.AnchorMode ? lib.AnchorMode.Any : 1,
          postConditionMode: lib.PostConditionMode ? lib.PostConditionMode.Allow : 0x01
        };

        const tx = await lib.makeContractCall(opciones);
        const envio = await lib.broadcastTransaction(tx);
        
        console.log(`Nonce ${miNonce} -> Resultado:`, envio.txid || envio.error || envio);
        
        if (!envio.error || envio.reason === "NonceAlreadyUsed") {
          miNonce++;
        }
        
        await new Promise(r => setTimeout(r, 30000));
      } catch (err) {
        console.error("Error en envío:", err.message);
        await new Promise(r => setTimeout(r, 15000));
      }
    }
  } catch (e) {
    console.error("ERROR CRÍTICO:", e.message);
  }
}

ejecutarBot();
