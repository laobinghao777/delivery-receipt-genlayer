import {execute, verifyNetwork, state, reconcile, safeError} from './runtime.mjs';
try {
  await verifyNetwork();
  if(state.pending!==null&&state.pending!==undefined)await reconcile();
  if(process.argv.includes('--new-version')&&state.contract){
    const {save}=await import('./runtime.mjs');
    const old=state.contract;
    state.archivedContracts??=[];state.archivedContracts.push({contract:old,archivedAt:new Date().toISOString()});
    for(const record of state.transactions)record.contract??=old;
    state.contract=null;save();
  }
  if(!state.contract)await execute('deploy');
  console.log('Application contract:',state.contract);
}catch(e){console.error(safeError(e));process.exitCode=1;}
