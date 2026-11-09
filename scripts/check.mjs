import fs from 'node:fs';
import { privateKeyToAccount } from 'viem/accounts';
import {createPublicClient,http,formatEther} from 'viem';
import {testnetBradbury} from 'genlayer-js/chains';
const key = fs.readFileSync('pk.txt','utf8').trim().replace(/^0x/,'');
if (!/^[0-9a-fA-F]{64}$/.test(key)) throw new Error('pk.txt must contain one private key');
const account=privateKeyToAccount(`0x${key}`);
const client=createPublicClient({chain:testnetBradbury,transport:http('https://rpc.testnet-chain.genlayer.com',{timeout:15000,retryCount:1})});
const [chainId,genesis,balance,nonce,code,manager]=await Promise.all([
  client.getChainId(),client.getBlock({blockNumber:0n}),client.getBalance({address:account.address}),
  client.getTransactionCount({address:account.address}),client.getCode({address:testnetBradbury.consensusMainContract.address}),
  client.readContract({address:testnetBradbury.consensusMainContract.address,abi:testnetBradbury.consensusMainContract.abi,functionName:'getAddressManager'}).catch(()=>null),
]);
const result={at:new Date().toISOString(),address:account.address,chainId,genesis:genesis.hash,balanceGEN:formatEther(balance),balanceWei:balance.toString(),nonce,consensus:testnetBradbury.consensusMainContract.address,consensusHasCode:!!code && code!=='0x',addressManager:manager};
fs.mkdirSync('logs',{recursive:true});fs.writeFileSync('logs/preflight.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
if(chainId!==4221 || genesis.hash!=='0x17d89764d4f4f963158fc4c5e8f2cb670c2837740b35f37081c12860c3df97e4') throw new Error('Unexpected network identity');
