// Reproducible real-network demo through the running localhost application.
// Resume an existing demo instead of duplicating it after a timeout or restart.
import fs from 'node:fs';
import {formatEther} from 'viem';
const BASE='http://127.0.0.1:4317';
const {token}=await(await fetch(`${BASE}/api/session`)).json();
const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json'};
async function snapshot(){const r=await fetch(`${BASE}/api/state`,{headers});if(!r.ok)throw new Error('Local application unavailable');return r.json();}
async function wait(){
 for(let i=0;i<100;i++){
  const s=await snapshot();if(!s.busy&&!s.pending)return s;
  if(i%4===0)console.log('Waiting for consensus and final fee settlement…');
  await new Promise(resolve=>setTimeout(resolve,5000));
 }
 throw new Error('Demo wait timed out; run npm run demo again to resume, do not resend manually');
}
async function act(action,args){
 const r=await fetch(`${BASE}/api/action`,{method:'POST',headers,body:JSON.stringify({action,args})});const d=await r.json();if(!r.ok)throw new Error(d.error);
 const s=await wait();if(s.lastOperation?.status==='error')throw new Error(s.lastOperation.error);return s;
}
const title='新品发布邮件验收';
let s=await wait();
let b=s.items.find(x=>x.title===title&&x.owner.toLowerCase()===s.wallet.toLowerCase());
if(!b){s=await act('create_brief',[title,JSON.stringify(['正文明确说明产品叫「折叠灯」，用途是桌面照明','正文包含售价 199 元和优惠截止日期 11 月 30 日','结尾包含明确的购买行动号召'])]);b=s.items.find(x=>x.title===title&&x.owner.toLowerCase()===s.wallet.toLowerCase());}
if(b.status==='open'){
 s=await act('submit_delivery',[b.id,'你好！我们推出了用于桌面照明的新产品「折叠灯」。它可折叠收纳，适合书桌、床头和出差使用。现在售价 199 元，本次优惠截止至 11 月 30 日。立即购买折叠灯，为你的桌面点亮舒适光线！']);b=s.items.find(x=>x.id===b.id);
}
if(b.status==='submitted'){s=await act('evaluate',[b.id]);b=s.items.find(x=>x.id===b.id);}
if(b.status!=='reviewed')throw new Error('Demo has not completed');
const records=s.transactions.filter(r=>r.contract===s.contract&&['create_brief','submit_delivery','evaluate'].includes(r.action)&&r.status==='finalized');
const totalWei=records.reduce((sum,r)=>sum+BigInt(r.netCostWei),0n);
const report={completedAt:new Date().toISOString(),wallet:s.wallet,contract:s.contract,brief:b,netCostGEN:s.netCostGEN,workflowCostWei:totalWei.toString(),workflowCostGEN:formatEther(totalWei),records,balanceGEN:s.balanceGEN};
fs.writeFileSync('logs/demo-result.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({briefId:b.id,verdict:b.assessment.verdict,workflowCostGEN:report.workflowCostGEN,balanceGEN:s.balanceGEN},null,2));
