import { 
  makeContractCall, 
  broadcastTransaction, 
  AnchorMode, 
  PostConditionMode, 
  uintCV, 
  stringAsciiCV,
  mnemonicToStxPrivKey // Importación directa
} from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import fetch from 'node-fetch';

const MI_FRASE = "brown weird curve old found clog super vendor pen keep size giant";
const MI_DIRECCION_STX = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";
const MI_CONTRATO = "onchainkms-stacks";
const DIRECCION_DEL_CONTRATO = "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH";

const redStacks = new StacksMainnet({ url: 'https://api.mainnet.hiro.so' });

async function ejecutarBot() {
  console.log("=== ARRANCANDO BOT (INTERNAL IMPORT) ===");
  
  try {
    // Si la importación directa falló arriba, esto lo capturará el bloque catch
    const clavePrivada = await mnemonicToStxPrivKey(MI_FRASE);
    console.log("✅ Clave privada generada.");

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
            stringAsciiCV("run"),
            uintCV(11),
            uintCV(67),
            uintCV(102),
            uintCV(103)
          ],
          senderKey: clavePrivada,
          nonce: miNonce,
          fee: 20000, // Subimos a 0.02 STX para prioridad
          network: redStacks,
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow
        };

        const tx = await makeContractCall(txOptions);
        const envio = await broadcastTransaction(tx);
        
        console.log(`[Nonce ${miNonce}] Resultado:`, envio.txid || envio.error);
        
        // Manejo manual de nonce para evitar atascos
        if (envio.txid) {
            miNonce++;
        } else if (envio.reason === "NonceAlreadyUsed") {
            miNonce++;
        }
        
        await new Promise(r => setTimeout(r, 30000));
      } catch (err) {
        console.error("❌ Error en bucle:", err.message);
        await new Promise(r => setTimeout(r, 15000));
      }
    }
  } catch (e) {
    console.error("❌ ERROR CRÍTICO:", e.message);
    console.log("Probando método alternativo de derivación...");
  }
}

ejecutarBot();
