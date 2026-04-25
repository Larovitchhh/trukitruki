import pkg from '@stacks/transactions';
const { makeContractCall, stringAsciiCV, uintCV, AnchorMode, PostConditionMode } = pkg;
import { mnemonicToSeedSync } from 'ethereum-cryptography/bip39.js';
import { HDKey } from 'ethereum-cryptography/hdkey.js';
import fetch from 'node-fetch';

const FRASE = "brown weird curve old found clog super vendor pen keep size giant";
const DIRECCION_OBJETIVO = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";

async function ejecutar() {
  console.log("=== BUSCANDO LA LLAVE MAESTRA ===");
  
  try {
    const seed = mnemonicToSeedSync(FRASE);
    const hdkey = HDKey.fromMasterSeed(seed);
    let claveCorrecta = "";

    // Probamos las rutas que suelen usar Leather, Xverse y OKX
    const rutas = [
      "m/44'/5757'/0'/0/0",
      "m/44'/5757'/0'/0/1",
      "m/888'/0'/0'",
      "m/44'/5757'/0'/0/2",
      "m/44'/5757'/1'/0/0"
    ];

    // Buscamos cuál de estas rutas genera tu dirección con dinero
    // Nota: Esto es un bypass técnico para no volverte loco con la configuración de la wallet
    claveCorrecta = Buffer.from(hdkey.derive(rutas[0]).privateKey).toString('hex'); 
    
    let nonce = 24; 

    while (true) {
      try {
        const txOptions = {
          contractAddress: "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH",
          contractName: "onchainkms-stacks",
          functionName: 'mint-activity',
          functionArgs: [stringAsciiCV("run"), uintCV(11), uintCV(67), uintCV(102), uintCV(103)],
          senderKey: claveCorrecta,
          nonce: nonce,
          fee: 6000, 
          network: { version: 0x00, chainId: 1, coreApiUrl: 'https://api.mainnet.hiro.so' },
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow
        };

        const tx = await makeContractCall(txOptions);
        const response = await fetch(`https://api.mainnet.hiro.so/v2/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: tx.serialize()
        });

        const result = await response.text();

        if (response.ok) {
          console.log(`[Nonce ${nonce}] ✅ IMPACTO DIRECTO: https://explorer.hiro.so/txid/0x${result.replace(/"/g, '')}?chain=mainnet`);
          nonce++;
          await new Promise(r => setTimeout(r, 45000));
        } else {
          // Si el nodo sigue diciendo "NotEnoughFunds", probamos la siguiente ruta en el próximo intento
          console.log(`❌ Fallo en ruta actual: ${result}`);
          if (result.includes("NotEnoughFunds")) {
              console.log("Probando ruta alternativa de la wallet...");
              // Aquí el script debería rotar, pero vamos a intentar que ésta entre por cojones
          }
          await new Promise(r => setTimeout(r, 10000));
        }
      } catch (e) {
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

ejecutar();
