import pkg from '@stacks/transactions';
const { makeContractCall, stringAsciiCV, uintCV, AnchorMode, PostConditionMode, broadcastTransaction } = pkg;

// USAMOS EL NODO OFICIAL DE LA FUNDACIÓN, NO EL DE HIRO
const API_URL = "https://stacks-node-api.mainnet.stacks.co";
const PRIVATE_KEY = "ccada837a66ff06e2ba5982ef0e105609ca19cbd523b5ca06edffe1aa9fc094201";

async function ejecutar() {
  console.log("=== USANDO NODO OFICIAL DE LA FUNDACIÓN (ANTI-LAG) ===");
  
  while (true) {
    try {
      // Consultamos el nonce real en el nodo de la fundación
      const res = await fetch(`${API_URL}/v2/accounts/SP2GCQYZE737A6BMK827BQKVX1WWFKFQX2RKQDK3G?proof=0`);
      const data = await res.json();
      let currentNonce = data.nonce;

      console.log(`📡 Nonce real detectado: ${currentNonce}`);

      const txOptions = {
        contractAddress: "SP1AJVMEGSMD6QCSZ1669Z5G90GEHVK2MEM7J0AHH",
        contractName: "onchainkms-stacks",
        functionName: 'mint-activity',
        functionArgs: [stringAsciiCV("run"), uintCV(11), uintCV(67), uintCV(102), uintCV(103)],
        senderKey: PRIVATE_KEY,
        nonce: currentNonce,
        fee: 5000, 
        network: { version: 0x00, chainId: 1, coreApiUrl: API_URL },
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
      };

      const transaction = await makeContractCall(txOptions);
      
      const response = await fetch(`${API_URL}/v2/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: transaction.serialize()
      });

      const result = await response.json();

      if (result.error) {
        console.log(`❌ Nodo: ${result.reason || result.error}`);
        // Si la red está saturada de tus propias TXs, esperamos
        if (result.reason === 'TooMuchChaining') {
            console.log("⏳ La red tiene 25 TXs tuyas en cola. Esperando 5 min...");
            await new Promise(r => setTimeout(r, 300000));
        }
      } else {
        console.log(`✅ TX ENVIADA: 0x${result}`);
        await new Promise(r => setTimeout(r, 60000));
      }

    } catch (err) {
      console.log("⚠️ Reintentando...");
      await new Promise(r => setTimeout(r, 10000));
    }
  }
}

ejecutar();
