import sys, types, json, unittest, importlib.util
from pathlib import Path
class VMError(Exception): pass
class Contract:
    def __new__(cls):
        obj=super().__new__(cls); obj.records={}; return obj
sender=types.SimpleNamespace(as_hex='owner')
release={'id':1,'tag_name':'v1.0','draft':False,'published_at':'2026-01-01','html_url':'https://github.com/example/project/releases/tag/v1.0','body':'This release adds export to CSV for all public reports.'}
gl=types.ModuleType('genlayer')
gl.contract=types.SimpleNamespace(Contract=Contract)
gl.storage=types.SimpleNamespace(TreeMap=dict)
gl.message=types.SimpleNamespace(sender_address=sender)
gl.public=types.SimpleNamespace(write=lambda f:f,view=lambda f:f)
gl.vm=types.SimpleNamespace(UserError=VMError)
gl.eq_principle=types.SimpleNamespace(strict_eq=lambda f:f(),prompt_comparative=lambda f,p:f())
gl.nondet=types.SimpleNamespace(web=types.SimpleNamespace(get=lambda u:types.SimpleNamespace(status=200,body=json.dumps(release).encode())),exec_prompt=lambda *a,**k:{'verdict':'supported','reason':'CSV export is explicitly announced','passage_ids':[1]})
gt=types.ModuleType('genlayer.types');gt.u256=int
sys.modules['genlayer']=gl;sys.modules['genlayer.types']=gt
spec=importlib.util.spec_from_file_location('guard',Path(__file__).parent/'contracts/release_guard.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
class Rules(unittest.TestCase):
    def setUp(self):
        sender.as_hex='owner';release['draft']=False
        gl.nondet.exec_prompt=lambda *a,**k:{'verdict':'supported','reason':'CSV export is explicit','passage_ids':[1]}
        self.c=mod.ReleaseGuard();self.c.create_check('example','project','v1.0','This release adds CSV export.')
    def test_url_injection(self):
        for bad in ['../x','https://evil','%2f','x?y','..']:
            with self.assertRaises(VMError):self.c.create_check(bad,'project','v1','Some release claim')
    def test_owner(self):
        sender.as_hex='other'
        with self.assertRaises(VMError):self.c.capture_release('1')
    def test_draft(self):
        release['draft']=True
        with self.assertRaises(VMError):self.c.capture_release('1')
        self.assertEqual(json.loads(self.c.get_check('1'))['status'],'created')
    def test_finality_and_quotes(self):
        self.c.capture_release('1');self.c.assess_claim('1')
        r=json.loads(self.c.get_check('1'));self.assertEqual(r['assessment']['quotes'],[release['body']])
        for fn in [self.c.capture_release,self.c.assess_claim]:
            with self.assertRaises(VMError):fn('1')
    def test_bad_citation(self):
        self.c.capture_release('1');gl.nondet.exec_prompt=lambda *a,**k:{'verdict':'supported','reason':'wrong','passage_ids':[99]}
        with self.assertRaises(VMError):self.c.assess_claim('1')
    def test_absence_not_support(self):
        self.c.capture_release('1');gl.nondet.exec_prompt=lambda *a,**k:{'verdict':'insufficient_evidence','reason':'Not mentioned','passage_ids':[]}
        self.c.assess_claim('1');self.assertEqual(json.loads(self.c.get_check('1'))['assessment']['verdict'],'insufficient_evidence')
if __name__=='__main__':unittest.main()
