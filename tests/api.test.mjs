import {test} from 'node:test';
import assert from 'node:assert/strict';
const base='http://127.0.0.1:4317';
test('local signer API rejects unauthenticated and cross-origin actions',async()=>{
  let r=await fetch(`${base}/api/action`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  assert.equal(r.status,401);
  r=await fetch(`${base}/api/session`,{headers:{Origin:'https://untrusted.example'}});
  assert.equal(r.status,403);
  r=await fetch(`${base}/pk.txt`);assert.equal(r.status,404);
  r=await fetch(`${base}/scripts/runtime.mjs`);assert.equal(r.status,404);
});
