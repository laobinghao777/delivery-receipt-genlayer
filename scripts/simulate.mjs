import fs from 'node:fs';
import {toHex,toRlp,zeroAddress} from 'viem';
import {privateKeyToAccount} from 'viem/accounts';
import {NODE_RPC} from './rpc.mjs';
// Minimal encoding for a constructor with one string argument, matching SDK calldata.
function variableInt(n) { const a=[]; do {let b=Number(n&127n); n>>=7n;a.push(b|(n?128:0));}while(n);return a; }
function encodeString(s) {const b=Buffer.from(s);return [...variableInt(BigInt(b.length)*8n+4n),...b];}
export function deployData(code,initial) {
  const args=Uint8Array.from([14,4,...Buffer.from('args'),13,...encodeString(initial)]);
  return toRlp([toHex(code),toHex(args),toHex(false)]);
}
export async function simulateDeploy(address,code,initial) {
  const r=await fetch(NODE_RPC,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'gen_call',params:[{from:address,to:zeroAddress,type:'deploy',data:deployData(code,initial)}]}),signal:AbortSignal.timeout(45000)});
  const d=await r.json(); if(d.error)throw new Error(JSON.stringify(d.error));return d.result;
}
if(process.argv[1]?.endsWith('simulate.mjs')) {
 const a=privateKeyToAccount(`0x${fs.readFileSync('pk.txt','utf8').trim().replace(/^0x/,'')}`);
 const result=await simulateDeploy(a.address,new Uint8Array(fs.readFileSync('contracts/storage.py')),'backend-initial');
 fs.writeFileSync('logs/deploy-simulation.json',JSON.stringify(result,null,2));
 console.log(JSON.stringify(result).slice(0,5000));
}
