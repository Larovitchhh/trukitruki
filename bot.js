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
  console.log("=== ARRANCANDO BOT CON PARÁMETROS REALES ===");
  
  try {
    // Buscamos la función de derivación (v6 utiliza mnemonicToStxPrivKey)
    const deriveFn = pkg.mnemonicToStxPrivKey || pkg.generatePrivateKeyFromMnemonic;
    
    if (!deriveFn) {
      throw new Error("No se encontró la función de derivación en @stacks/transactions");
    }

    const clavePrivada = await deriveFn(MI_FRASE);
    console.log("Clave privada lista.");

    // Obtenemos el Nonce inicial
    const peticion = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${MI_DIRECCION_STX}?proof=0`);
    const cuenta = await peticion.json();
    let miNonce = cuenta.nonce || 0;
    
    console.log("Nonce inicial detectado:", miNonce);

    while (true) {
      try {
        const opciones = {
          contractAddress: DIRECCION_DEL_CONTRATO,
          contractName: MI_CONTRATO,
          functionName: 'mint-activity',
          functionArgs: [
            pkg.stringAsciiCV("run"),   // activityType
            pkg.uintCV(11),             // distance
            pkg.uintCV(67),             // duration
            pkg.uintCV(102),            // elevation
            pkg.uintCV(103)             // xp
          ],
          senderKey: clavePrivada,
          nonce: miNonce,
          fee: 15000, 
          network: redStacks,
          anchorMode: pkg.AnchorMode.Any,
          postConditionMode: pkg.PostConditionMode.Allow
        };

        const tx = await pkg.makeContractCall(opciones);
        const envio = await pkg.broadcastTransaction(tx);
        
        console.log(`Nonce ${miNonce} -> TXID:`, envio.txid || envio.error || envio);
        
        // Solo sumamos el nonce si no hubo un error de red
        if (!envio.error) {
          miNonce++;
        } else if (envio.reason === "NonceAlreadyUsed") {
          miNonce++; // Corregimos si se desincroniza
        }
        
        // Espera de 30 segundos entre minteos
        await new Promise(r => setTimeout(r, 30000));
      } catch (err) {
        console.error("Error enviando transacción:", err.message);
        await new Promise(r => setTimeout(r, 15000));
      }
    }
  } catch (e) {
    console.error("ERROR CRITICO:", e.message);
  }
}

ejecutarBot();
