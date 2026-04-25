import pkg from '@stacks/transactions';
import netPkg from '@stacks/network';
import fetch from 'node-fetch';

const { StacksMainnet } = netPkg;

// Extraemos lo que necesitamos del paquete principal de forma segura
const { 
  makeContractCall, 
  broadcastTransaction, 
  uintCV, 
  stringAsciiCV,
} = pkg;

async function ejecutar() {
  console.log("=== INICIO DEL BOT (SIN LIBRERÍAS EXTERNAS) ===");
  
  try {
    const frase = "brown weird curve old found clog super vendor pen keep size giant";
    const direccion = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";
    const red = new StacksMainnet({ url: 'https://api.mainnet.hiro.so' });

    // Intentamos obtener la clave usando el buscador de funciones que hicimos antes
    // pero de forma mucho más directa y robusta
    let deriveFn = pkg.mnemonicToStxPrivKey || (pkg.default && pkg.default.mnemonicToStxPrivKey);
    
    if (!deriveFn) {
        // Si no la encuentra, intentamos cargarla dinámicamente
        const temp = await import('@stacks/transactions');
        deriveFn = temp.mnemonicToStxPrivKey;
    }

    if (!deriveFn) throw new Error("No se pudo localizar la función de clave.");

    const clavePrivada = await deriveFn(frase);
    console.log("✅ Clave lista.");

    const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${direccion}?proof=0`);
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
          fee: 85000, 
          network: red,
          anchorMode: 1, 
          postConditionMode: 0x01
        };

        const tx = await makeContractCall(txOptions);
        const result = await broadcastTransaction(tx);
        
        console.log(`[Nonce ${nonce}] TX: ${result.txid || 'Error'}`);
        
        if (result.txid || JSON.stringify(result).includes("Nonce")) {
          nonce++;
        }
        await new Promise(r => setTimeout(r, 20000));
      } catch (err) {
        console.log("Error en envío:", err.message);
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  } catch (err) {
    console.error("❌ ERROR FINAL:", err.message);
    console.log("Revisa si el nombre de las funciones ha cambiado en esta versión.");
  }
}

ejecutar();
