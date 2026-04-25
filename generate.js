import { makeRandomPrivKey, getAddressFromPrivateKey } from '@stacks/transactions';

const privateKey = makeRandomPrivKey();
const address = getAddressFromPrivateKey(privateKey, 'mainnet');

console.log("PRIVATE_KEY:", privateKey);
console.log("ADDRESS:", address);
