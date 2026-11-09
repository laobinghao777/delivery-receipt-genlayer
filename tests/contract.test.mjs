import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
test('contract ownership, evidence integrity, response validation and finality',()=>{
  const result=spawnSync('python',['tests/contract_test.py'],{encoding:'utf8',timeout:30000});
  assert.equal(result.status,0,result.stderr||result.error?.message);
});
