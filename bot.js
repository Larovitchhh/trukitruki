import pkg from '@stacks/transactions';
import netPkg from '@stacks/network';
import fetch from 'node-fetch';

const { StacksMainnet } = netPkg;

async function ejecutar() {
  console.log("=== BUSCANDO FUNCIÓN DE CLAVE EN EL PAQUETE ===");
  
  try {
    // 1. Intentamos localizar la función de derivación manualmente
    let deriveFn = pkg.mnemonicToStxPrivKey || 
                   pkg.generatePrivateKeyFromMnemonic || 
                   (pkg.default && pkg.default.mnemonicToStxPrivKey);

    // Si sigue siendo undefined, buscamos en las claves del objeto
    if (!deriveFn) {
        const keys = Object.keys(pkg);
        const foundKey = keys.find(k => k.toLowerCase().includes('mnemonic') && k.toLowerCase().includes('priv'));
        if (foundKey) deriveFn = pkg[foundKey];
    }

    if (typeof deriveFn !== 'function') {
        console.log("Contenido del paquete:", Object.keys(pkg));
        throw new Error("No existe ninguna función de derivación en este paquete.");
    }

    const FRASE = "brown weird curve old found clog super vendor pen keep size giant";
    const clavePrivada = await deriveFn(FRASE);
    console.log("✅ Clave generada con éxito.");

    const DIRECCION = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";
    const red = new StacksMainnet({ url: 'https://api.mainnet.hiro.so' });

    console.log("Consultando Nonce...");
    const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${DIRECCION}?proof=0`);
    const data = await res.json();
    let nonce = data.nonce || 0;
    console.log("✅ Nonce:", nonce);

    while (true) {
      try {
        const txOptions = {
          contractAddress: "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH",
          contractName: "onchainkms-stacks",
          functionName: 'mint-activity',
          functionArgs: [
            pkg.stringAsciiCV("run"),
            pkg.uintCV(11),
            pkg.uintCV(67),
            pkg.uintCV(102),
            pkg.uintCV(103)
          ],
          senderKey: clavePrivada,
          nonce: nonce,
          fee: 75000, 
          network: red,
          anchorMode: 1, 
          postConditionMode: 0x01
        };

        const tx = await pkg.makeContractCall(txOptions);
        const result = await pkg.broadcastTransaction(tx);
        
        console.log(`[Nonce ${nonce}] TXID: ${result.txid || 'Error'}`);
        
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
    console.error("❌ ERROR CRÍTICO:", err.message);
  }
}

ejecutar();
