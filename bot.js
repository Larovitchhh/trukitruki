import * as StacksTx from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import fetch from 'node-fetch';

// DATOS HARDCODEADOS
const MI_FRASE = "brown weird curve old found clog super vendor pen keep size giant";
const MI_DIRECCION_STX = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";
const MI_CONTRATO = "onchainkms-stacks";
const DIRECCION_DEL_CONTRATO = "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH";

const redStacks = new StacksMainnet({ url: 'https://api.mainnet.hiro.so' });

async function ejecutarBot() {
  console.log("=== ARRANCANDO BOT (REPARACIÓN DE LIBRERÍA V6) ===");
  
  try {
    // En v6, las funciones suelen estar en el root si se importa con *
    const deriveFn = StacksTx.mnemonicToStxPrivKey || StacksTx.generatePrivateKeyFromMnemonic;
    
    if (!deriveFn) {
      console.log("Funciones detectadas:", Object.keys(StacksTx).filter(k => k.toLowerCase().includes('key')));
      throw new Error("No se pudo encontrar la función para la clave privada.");
    }

    const clavePrivada = await deriveFn(MI_FRASE);
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
            StacksTx.stringAsciiCV("run"),
            StacksTx.uintCV(11),
            StacksTx.uintCV(67),
            StacksTx.uintCV(102),
            StacksTx.uintCV(103)
          ],
          senderKey: clavePrivada,
          nonce: miNonce,
          fee: 15000, 
          network: redStacks,
          anchorMode: StacksTx.AnchorMode ? StacksTx.AnchorMode.Any : 1,
          postConditionMode: StacksTx.PostConditionMode ? StacksTx.PostConditionMode.Allow : 0x01
        };

        const tx = await StacksTx.makeContractCall(txOptions);
        const envio = await StacksTx.broadcastTransaction(tx);
        
        console.log(`[Nonce ${miNonce}] TX Enviada! ID:`, envio.txid || envio.error);
        
        if (!envio.error || envio.reason === "NonceAlreadyUsed") {
          miNonce++;
        }
        
        await new Promise(r => setTimeout(r, 30000));
      } catch (err) {
        console.error("❌ Error en envío:", err.message);
        await new Promise(r => setTimeout(r, 15000));
      }
    }
  } catch (e) {
    console.error("❌ ERROR CRÍTICO:", e.message);
  }
}

ejecutarBot();
