const $=(s)=>document.querySelector(s);
const escape=(s)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons={grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',chart:'M4 20h17M7 16v-5M12 16V5M17 16V8',wallet:'M19 7H5a2 2 0 0 1 0-4h13v4M3 5v14a2 2 0 0 0 2 2h16V7M21 12h-6v5h6',plus:'M12 5v14M5 12h14',file:'M14 2H5v20h14V7zM14 2v6h5M8 12h8M8 16h5',check:'M5 12l4 4L19 6',clock:'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',refresh:'M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 2M18 18A8 8 0 0 1 5 16',search:'M21 21l-6-6M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',download:'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4',lock:'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4'};
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[el.dataset.icon]||icons.file}"/></svg>`);
let token='',data=null,selected=null,filter='all',query='',loading=false,mode='workspace',lastOperationKey='',detailSignature='',pollTimer;
const labels={open:'待提交',submitted:'待验收',reviewed:'已验收',finalized:'已结算',pending:'共识中',signed:'已签名',preparing:'准备中',reverted:'交易回退',execution_failed:'执行失败',not_sent:'未发送'};
const actionLabels={deploy:'部署应用合约',create_brief:'创建验收单',submit_delivery:'提交交付内容',evaluate:'AI 共识验收'};
const short=(s)=>s?`${s.slice(0,6)}…${s.slice(-4)}`:'—';
const num=(v,d=6)=>Number(v??0).toLocaleString('en-US',{maximumFractionDigits:d});
const wei=(v)=>v===undefined?'—':num(Number(v)/1e18,9);
const badge=(status)=>`<span class="badge ${escape(status)}">${escape(labels[status]??status)}</span>`;
function notice(message,type=''){const el=$('#notice');el.hidden=!message;el.className=`notice ${type}`;el.textContent=message;}
async function api(url,options={}){const r=await fetch(url,{...options,headers:{Authorization:`Bearer ${token}`,...options.headers}});const result=await r.json();if(!r.ok)throw new Error(result.error??'请求失败');return result;}
function renderList(){
 const items=(data?.items??[]).filter(b=>(filter==='all'||b.status===filter)&&(!query||`${b.title} ${b.id}`.toLowerCase().includes(query)));
 $('#brief-list').innerHTML=items.length?items.map(b=>`<button class="brief-card ${selected===b.id?'selected':''}" data-id="${escape(b.id)}"><span class="card-top"><span class="brief-number">BRIEF / ${String(b.id).padStart(3,'0')}</span>${badge(b.status)}</span><span class="brief-title">${escape(b.title)}</span><span class="card-meta"><span>${b.criteria.length} 条验收标准</span><span>${b.status==='reviewed'?`${b.assessment.items.filter(x=>x.status==='met').length}/${b.criteria.length} 项满足`:'等待下一步 →'}</span></span></button>`).join(''):'<p class="empty-small">暂无符合条件的验收单。<br>点击「新建验收单」开始。</p>';
 document.querySelectorAll('.brief-card').forEach(b=>b.onclick=()=>{selected=b.dataset.id;renderList();renderDetail();});
}
function renderDetail(){
 const b=data?.items.find(x=>x.id===selected);if(!b)return;
 const busy=data.busy||data.pending||b.owner.toLowerCase()!==data.wallet.toLowerCase();
 const signature=JSON.stringify([b,busy]);if(signature===detailSignature)return;detailSignature=signature;
 const reviewed=b.status==='reviewed';
 const verdictLabels={accepted:['交付通过验收','每条标准均有交付原文支持。'],needs_revision:['交付需要修改','部分标准尚未满足，请查看逐项说明。'],insufficient_evidence:['证据尚不充分','当前文本无法支持完整验收，请补足可核查内容。']};
 const v=reviewed?verdictLabels[b.assessment.verdict]:null;
 $('#detail-panel').innerHTML=`<div class="detail-top"><span class="brief-number">ACCEPTANCE BRIEF / ${String(b.id).padStart(3,'0')}</span>${badge(b.status)}</div><h2 class="detail-title">${escape(b.title)}</h2><p class="detail-subtitle">创建者 ${escape(short(b.owner))} <span class="muted">·</span> 不可更改的验收约定</p><div class="progress-steps"><span class="done"><b>✓</b>约定标准</span><i></i><span class="${b.status!=='open'?'done':''}"><b>${b.status!=='open'?'✓':'2'}</b>提交成果</span><i></i><span class="${reviewed?'done':''}"><b>${reviewed?'✓':'3'}</b>共识验收</span></div>${v?`<div class="verdict ${escape(b.assessment.verdict)}"><span class="verdict-icon">${b.assessment.verdict==='accepted'?'✓':'!'}</span><div><h3>${v[0]}</h3><p>${v[1]}</p></div></div>`:''}<h3 class="section-label">验收标准 <small>${b.criteria.length} CRITERIA${reviewed?' · GENLAYER CONSENSUS':''}</small></h3><ol class="criteria-list">${b.criteria.map((c,i)=>{const item=b.assessment?.items[i];return `<li class="criterion"><span class="num">${String(i+1).padStart(2,'0')}</span><div class="criterion-body"><div class="criterion-heading"><span>${escape(c)}</span>${item?`<span class="badge ${item.status==='met'?'reviewed':'submitted'}">${({met:'满足',not_met:'未满足',unclear:'待证实'})[item.status]}</span>`:''}</div>${item?`<p class="criterion-reason">${escape(item.reason)}</p>${item.quote?`<blockquote class="evidence-quote">${escape(item.quote)}</blockquote>`:''}`:''}</div></li>`;}).join('')}</ol>${b.status==='open'?`<form class="delivery-form" id="delivery-form"><h3 class="section-label">提交交付内容 <small>TEXT EVIDENCE</small></h3><textarea name="evidence" required minlength="20" maxlength="12000" rows="7" placeholder="粘贴需要验收的实际文本，例如邮件文案、文档或交付说明。AI 只依据这些内容判断；一个链接不能证明网站或代码已经正常运行。"></textarea><p>提交后内容将锁定，并公开保存在测试链上。支持 20–12000 字。</p><div class="detail-actions"><button class="primary" ${busy?'disabled':''}>锁定并提交交付 <span>↗</span></button></div></form>`:`<h3 class="section-label">交付原文 <small>COMMITTED EVIDENCE</small></h3><div class="delivery-text">${escape(b.evidence)}</div><p class="evidence-hash">SHA-256 · ${escape(b.evidence_sha256)}</p>${b.status==='submitted'?`<div class="review-callout"><h3>交付已锁定，等待独立判断。</h3><p>GenLayer 验证者将按约定逐条验收。结果包含判断、原因与原文引证；通常需要数分钟完成共识和费用结算。</p><button class="primary" id="evaluate" ${busy?'disabled':''}>发起 AI 共识验收 <span>↗</span></button></div>`:`<div class="review-callout"><h3>一份可追溯的验收记录。</h3><p>本次验收仅判断已提交文本，不代表代码运行验证或法律仲裁。修改交付时，请新建验收单保留版本历史。</p><button class="secondary" id="revision">基于这些标准创建新版本</button></div>`}`}`;
 $('#delivery-form')?.addEventListener('submit',e=>{e.preventDefault();send('submit_delivery',[b.id,new FormData(e.target).get('evidence').trim()]);});
 $('#evaluate')?.addEventListener('click',()=>send('evaluate',[b.id]));
 $('#revision')?.addEventListener('click',()=>{showCreate();const f=$('#create-form');f.elements.title.value=b.title+' · 修订版';f.elements.criteria.value=b.criteria.join('\n');});
}
function renderCosts(){
 $('#cost-rows').innerHTML=(data?.transactions??[]).slice().reverse().map(r=>`<tr><td>${escape(actionLabels[r.action]??r.action)}<small>${new Date(r.startedAt).toLocaleString('zh-CN',{hour12:false})}</small></td><td>${badge(r.status)}</td><td>${r.status==="not_sent"||r.status==="reverted"?"未支付":wei(r.feeDepositWei)+" GEN"}</td><td>${r.netCostGEN!==undefined?`${num(r.netCostGEN,9)} GEN`:r.status==='not_sent'?'0 GEN（未广播）':'等待最终结算'}</td><td>${r.txId?`<a href="https://scan.bradbury.genlayer.com/tx/${escape(r.txId)}" target="_blank" rel="noopener">${short(r.txId)} ↗</a>`:r.evmHash?`<a href="https://scan.testnet-chain.genlayer.com/tx/${escape(r.evmHash)}" target="_blank" rel="noopener">${short(r.evmHash)} ↗</a>`:'—'}</td></tr>`).join('')||'<tr><td colspan="5">暂无链上交易</td></tr>';
}
async function refresh(){
 if(loading)return;loading=true;
 try{
  const next=await api('/api/state');
  const previousIds=new Set(data?.items.map(x=>x.id)??[]);
  data=next;
  if(!selected&&data.items.length)selected=data.items[0].id;
  if(data.lastOperation?.action==='create_brief'&&data.lastOperation.status==='success'){
   const added=data.items.find(x=>!previousIds.has(x.id));if(added)selected=added.id;
  }
  $('#wallet-address').textContent=short(data.wallet);$('#wallet-address').title=data.wallet;
  $('#wallet-balance').textContent=`${num(data.balanceGEN,4)} GEN`;
  $('#nav-count').textContent=data.total;$('#stat-total').textContent=data.total;
  $('#stat-reviewed').textContent=data.items.filter(x=>x.status==='reviewed').length;
  $('#stat-pending').textContent=data.items.filter(x=>x.status!=='reviewed').length;
  $('#stat-cost').textContent=num(data.netCostGEN,7);
  if(data.contract)$('#contract-link').href=`https://scan.bradbury.genlayer.com/address/${data.contract}`;
  $('#new-brief').disabled=data.busy||data.pending||!data.contract;
  renderList();
  // Preserve unsent text while periodic refreshes update transaction state.
  const evidence=$('#delivery-form textarea')?.value;
  renderDetail();if(evidence&&$('#delivery-form textarea'))$('#delivery-form textarea').value=evidence;
  renderCosts();
  if(data.busy||data.pending){notice('交易已提交，正在等待链上共识与最终结算。请勿重复提交。','loading');}
  else if(data.lastOperation){
   const key=JSON.stringify(data.lastOperation);
   if(key!==lastOperationKey){lastOperationKey=key;if(data.lastOperation.status==='error')notice(data.lastOperation.error,'error');else if(data.lastOperation.status==='success')notice(`${actionLabels[data.lastOperation.action]}已完成，实际净消耗 ${num(data.lastOperation.netCostGEN,9)} GEN。`);}
  }else if(!data.contract)notice('应用尚未部署。请先在项目文件夹运行 npm run deploy。','error');
 }catch(e){notice(`读取链上状态失败：${e.message}。可点击刷新重试。`,'error');}
 finally{loading=false;clearTimeout(pollTimer);pollTimer=setTimeout(refresh,data?.busy||data?.pending?10000:30000);}
}
async function send(action,args){
 if(data?.busy||data?.pending)return;
 try{notice('正在创建交易，请稍候…','loading');await api('/api/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,args})});$('#create-dialog').close();if(data){data.busy=true;renderDetail();}await refresh();}catch(e){notice(e.message,'error');}
}
function showCreate(){if(data?.busy||data?.pending){notice('请等待当前交易完成。','loading');return;}$('#create-dialog').showModal();}
function showMode(next){mode=next;$('#workspace').hidden=next!=='workspace';$('#cost-panel').hidden=next!=='cost';$('#page-label').textContent=next==='cost'?'交互费用':'验收工作台';$('#nav-work').classList.toggle('active',next==='workspace');$('#nav-cost').classList.toggle('active',next==='cost');$('#mobile-cost').textContent=next==='cost'?'工作台 ↗':'费用 ↗';}
$('#new-brief').onclick=showCreate;$('#empty-create').onclick=showCreate;$('#close-dialog').onclick=()=>$('#create-dialog').close();
$('#nav-work').onclick=()=>showMode('workspace');$('#nav-cost').onclick=()=>showMode('cost');$('#refresh').onclick=refresh;
$('#mobile-cost').onclick=()=>showMode(mode==='cost'?'workspace':'cost');
$('#search').oninput=e=>{query=e.target.value.toLowerCase().trim();renderList();};
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('selected',x===b));renderList();});
$('#fill-example').onclick=()=>{const f=$('#create-form');f.elements.title.value='新品发布邮件验收';f.elements.criteria.value='正文明确说明产品叫「折叠灯」，用途是桌面照明\n正文包含售价 199 元和优惠截止日期 11 月 30 日\n结尾包含明确的购买行动号召';};
$('#create-form').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);const title=f.get('title').trim(),criteria=f.get('criteria').split('\n').map(x=>x.trim()).filter(Boolean);if(criteria.length<1||criteria.length>8||criteria.some(x=>x.length<5||x.length>500)||new Set(criteria).size!==criteria.length){notice('请填写 1–8 条不重复的标准，每条 5–500 字。','error');return;}send('create_brief',[title,JSON.stringify(criteria)]);};
$('#export-cost').onclick=()=>{const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),network:data.network,wallet:data.wallet,contract:data.contract,netCostGEN:data.netCostGEN,transactions:data.transactions},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='delivery-receipt-costs.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
try{({token}=await(await fetch('/api/session')).json());await refresh();}catch(e){notice('无法连接本地服务。请确认 npm start 正在运行。','error');}




