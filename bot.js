import pkg from '@stacks/transactions';
const { makeContractCall, stringAsciiCV, uintCV, AnchorMode, PostConditionMode, broadcastTransaction } = pkg;
import { StacksMainnet } from '@stacks/network';

const PRIVATE_KEY = "ccada837a66ff06e2ba5982ef0e105609ca19cbd523b5ca06edffe1aa9fc094201";
const network = new StacksMainnet();

async function ejecutar() {
  console.log("=== ARRANCANDO BOT MODO NATIVO ===");
  
  // Obtenemos el nonce una sola vez para empezar limpio
  const res = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G/nonces`);
  const data = await res.json();
  let currentNonce = data.possible_next_nonce;

  while (true) {
    try {
      console.log(`🚀 Lanzando Nonce: ${currentNonce}`);

      const txOptions = {
        contractAddress: "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH",
        contractName: "onchainkms-stacks",
        functionName: 'mint-activity',
        functionArgs: [stringAsciiCV("run"), uintCV(11), uintCV(67), uintCV(102), uintCV(103)],
        senderKey: PRIVATE_KEY,
        validateWithAbi: true, // Esto obliga al bot a verificar que la función existe antes de mandar basura
        network,
        nonce: currentNonce,
        fee: 4000, // Tu fee estándar, sin locuras
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
      };

      const transaction = await makeContractCall(txOptions);
      const response = await broadcastTransaction(transaction, network);

      // Si la respuesta tiene un error, lo tratamos aquí
      if (response.error) {
        console.log(`❌ Error: ${response.reason || response.error}`);
        if (response.reason === 'NonceAlreadyUsed') {
          currentNonce++;
        }
        await new Promise(r => setTimeout(r, 10000));
      } else {
        console.log(`✅ TXID: 0x${response.txid}`);
        currentNonce++;
        // Esperamos 45 segundos, lo normal
        await new Promise(r => setTimeout(r, 45000));
      }

    } catch (err) {
      console.log("⚠️ Fallo en el bucle, reintentando...");
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

ejecutar();
