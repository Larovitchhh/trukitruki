import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const StacksTx = require('@stacks/transactions');
const StacksNet = require('@stacks/network');
const StacksWallet = require('@stacks/wallet-sdk');
const fetch = require('node-fetch');

const MI_FRASE = "brown weird curve old found clog super vendor pen keep size giant";
const MI_DIRECCION_STX = "SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G";
const MI_CONTRATO = "onchainkms-stacks";
const DIRECCION_DEL_CONTRATO = "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH";

const redStacks = new StacksNet.StacksMainnet({ url: 'https://api.mainnet.hiro.so' });

async function ejecutarBot() {
  console.log("=== ARRANCANDO BOT (MOTOR WALLET SDK) ===");
  
  try {
    // MÉTODO ALTERNATIVO DE DERIVACIÓN (Más robusto)
    const wallet = await StacksWallet.generateWallet({
      mnemonic: MI_FRASE,
      passphrase: ''
    });
    const clavePrivada = wallet.accounts[0].stxPrivateKey;
    
    console.log("✅ Clave privada obtenida mediante Wallet SDK.");

    const res = await fetch(`https://api.mainnet.hiro.so/v2/accounts/${MI_DIRECCION_STX}?proof=0`);
    const cuenta = await res.json();
    let miNonce = cuenta.nonce || 0;
    
    console.log("✅ Nonce inicial:", miNonce);

    while (true) {
      try {
        const opciones = {
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
          fee: 30000, // 0.03 STX para asegurar que pase
          network: redStacks,
          anchorMode: 1, // Any
          postConditionMode: 0x01 // Allow
        };

        const tx = await StacksTx.makeContractCall(opciones);
        const envio = await StacksTx.broadcastTransaction(tx);
        
        console.log(`[Nonce ${miNonce}] TXID:`, envio.txid || envio.error);
        
        if (envio.txid || (envio.error && JSON.stringify(envio.error).includes("NonceAlreadyUsed"))) {
          miNonce++;
        }
        
        await new Promise(r => setTimeout(r, 20000));
      } catch (err) {
        console.error("❌ Error en envío:", err.message);
        await new Promise(r => setTimeout(r, 10000));
      }
    }
  } catch (e) {
    console.error("❌ ERROR CRÍTICO:", e.message);
    console.log("StackTrace:", e.stack);
  }
}

ejecutarBot();
