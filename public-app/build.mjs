import fs from 'node:fs/promises';
import {build} from 'esbuild';
const out=await build({entryPoints:['app.js'],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',minify:true});
const assets={'/app.js':{type:'text/javascript; charset=utf-8',body:out.outputFiles[0].text},'/style.css':{type:'text/css; charset=utf-8',body:await fs.readFile('style.css','utf8')}};
const html=await fs.readFile('index.html','utf8');
await fs.mkdir('dist/server',{recursive:true});
const worker=`const assets=${JSON.stringify(assets)};const html=${JSON.stringify(html)};
const headers={'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'"};
export default {async fetch(request){
 const url=new URL(request.url);
 if(url.pathname==='/rpc'){
  if(request.method!=='POST')return new Response('POST required',{status:405});
  if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)return new Response('Origin rejected',{status:403});
  const raw=await request.text();if(raw.length>70000)return new Response('Request too large',{status:413});
  let body;try{body=JSON.parse(raw);}catch{return new Response('Invalid JSON',{status:400});}
  if(!body||Array.isArray(body)||typeof body.method!=='string'||!Array.isArray(body.params||[]))return new Response('Invalid RPC',{status:400});
  const method=body.method,allowed=method==='eth_call'||method==='eth_estimateGas'||method==='eth_chainId'||/^eth_get[A-Za-z]+$/.test(method)||/^gen_(get|call|estimate)[A-Za-z_]*$/.test(method);
  if(!allowed)return Response.json({jsonrpc:'2.0',id:body.id,error:{code:-32601,message:'Only public read and estimation methods are relayed. Sign and submit transactions in your own wallet.'}},{status:403});
  const target=method.startsWith('eth_')?'https://rpc.testnet-chain.genlayer.com':'https://rpc-bradbury.genlayer.com';
  try{const r=await fetch(target,{method:'POST',headers:{'Content-Type':'application/json'},body:raw,signal:AbortSignal.timeout(30000)});return new Response(r.body,{status:r.status,headers:{...headers,'Content-Type':'application/json','Cache-Control':'no-store'}});}catch{return Response.json({jsonrpc:'2.0',id:body.id,error:{code:-32000,message:'Public RPC temporarily unavailable. Retry the read; do not resend a pending transaction.'}},{status:502});}
 }
 if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
 if(assets[url.pathname]){const a=assets[url.pathname];return new Response(request.method==='HEAD'?null:a.body,{headers:{...headers,'Content-Type':a.type,'Cache-Control':'public,max-age=300'}});}
 if(!['/','/delivery-receipt','/delivery-receipt/','/releaseguard','/releaseguard/'].includes(url.pathname))return new Response('Not found',{status:404,headers});
 return new Response(request.method==='HEAD'?null:html,{headers:{...headers,'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
}};`;
await fs.writeFile('dist/server/index.js',worker);console.log('Built public keyless worker and browser-wallet application.');
