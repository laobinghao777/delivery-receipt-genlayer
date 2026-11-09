import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT, snapshot, execute, verifyNetwork, safeError, state, reconcile} from './runtime.mjs';

const port=Number(process.env.PORT??4317);
const allowedHosts=new Set([`127.0.0.1:${port}`,`localhost:${port}`]);
const token=crypto.randomBytes(32).toString('hex');
let busy=false, lastOperation=null;
function json(res,status,data){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
const server=http.createServer(async(req,res)=>{
  if(!allowedHosts.has(req.headers.host)){json(res,403,{error:'Invalid host'});return;}
  if(req.headers.origin&&!new Set([`http://127.0.0.1:${port}`,`http://localhost:${port}`]).has(req.headers.origin)){json(res,403,{error:'Invalid origin'});return;}
  const pathname=new URL(req.url,`http://127.0.0.1:${port}`).pathname;
  try{
    if(pathname==='/api/session'&&req.method==='GET'){json(res,200,{token});return;}
    if(pathname.startsWith('/api/')){
      if(req.headers.authorization!==`Bearer ${token}`){json(res,401,{error:'Session required'});return;}
      if(pathname==='/api/state'&&req.method==='GET'){json(res,200,{...await snapshot(),busy,lastOperation});return;}
      if(pathname==='/api/action'&&req.method==='POST'){
        if(req.headers['content-type']!=='application/json'){json(res,415,{error:'JSON required'});return;}
        if(busy||state.pending!==null&&state.pending!==undefined){json(res,409,{error:'已有交易等待完成，请勿重复提交。'});return;}
        let data='';for await(const chunk of req){data+=chunk;if(Buffer.byteLength(data)>60000){json(res,413,{error:'Request too large'});return;}}
        const {action,args}=JSON.parse(data);
        if(!Array.isArray(args)||!args.every(a=>typeof a==='string')){json(res,400,{error:'Invalid arguments'});return;}
        if(action==='create_brief'){
          const criteria=JSON.parse(args[1]??'null');
          if(args.length!==2||args[0].trim().length<3||args[0].length>100||!Array.isArray(criteria)||criteria.length<1||criteria.length>8||criteria.some(x=>typeof x!=='string'||x.trim().length<5||x.length>500)||new Set(criteria.map(x=>x.trim())).size!==criteria.length){json(res,400,{error:'请填写标题和 1–8 条不重复的验收标准，每条 5–500 字。'});return;}
        }else if(action==='submit_delivery'){
          if(args.length!==2||!/^\d+$/.test(args[0])||args[1].trim().length<20||args[1].length>12000){json(res,400,{error:'交付内容需要 20–12000 字。'});return;}
        }else if(action==='evaluate'){
          if(args.length!==1||!/^\d+$/.test(args[0])){json(res,400,{error:'Invalid brief ID'});return;}
        }else{json(res,400,{error:'Unknown action'});return;}
        busy=true;lastOperation={action,status:'running',startedAt:new Date().toISOString()};
        json(res,202,{ok:true});
        execute(action,args).then(r=>{lastOperation={...lastOperation,status:'success',txId:r.txId,netCostGEN:r.netCostGEN};}).catch(e=>{lastOperation={...lastOperation,status:'error',error:safeError(e)};}).finally(()=>{busy=false;});return;
      }
      json(res,404,{error:'Not found'});return;
    }
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css','/favicon.svg':'favicon.svg'};
    const filename=files[pathname];if(!filename){res.writeHead(404);res.end('Not found');return;}
    const mime={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml'};
    res.writeHead(200,{'Content-Type':mime[filename.split('.').pop()],'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; connect-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; frame-ancestors 'none'"});
    res.end(req.method==='HEAD'?'':fs.readFileSync(path.join(ROOT,'web',filename)));
  }catch(e){json(res,500,{error:safeError(e)});}
});
try{
 await verifyNetwork();
 if(state.pending!==null&&state.pending!==undefined){busy=true;reconcile().catch(e=>console.error(safeError(e))).finally(()=>{busy=false;});}
 server.listen(port,'127.0.0.1',()=>console.log(`Delivery Receipt is ready: http://127.0.0.1:${port}`));
}catch(e){console.error(safeError(e));process.exitCode=1;}
