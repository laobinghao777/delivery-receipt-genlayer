"""Business-rule tests with a minimal VM adapter; real consensus is tested separately on-chain."""
import sys
import types
import json
import unittest
import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

class VMError(Exception):
    pass

class Contract:
    def __new__(cls):
        instance = super().__new__(cls)
        instance.briefs = {}
        return instance

sender = types.SimpleNamespace(as_hex="0x1111111111111111111111111111111111111111")
gl = types.ModuleType("genlayer")
gl.contract = types.SimpleNamespace(Contract=Contract)
gl.storage = types.SimpleNamespace(TreeMap=dict)
gl.message = types.SimpleNamespace(sender_address=sender)
gl.public = types.SimpleNamespace(write=lambda f: f, view=lambda f: f)
gl.vm = types.SimpleNamespace(UserError=VMError)
gl.nondet = types.SimpleNamespace(exec_prompt=lambda *a, **kw: "")
gl.eq_principle = types.SimpleNamespace(prompt_comparative=lambda fn, principle: fn())
gt = types.ModuleType("genlayer.types")
gt.u256 = int
sys.modules["genlayer"] = gl
sys.modules["genlayer.types"] = gt
spec = importlib.util.spec_from_file_location("receipt", ROOT / "contracts/delivery_receipt.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ContractRules(unittest.TestCase):
    def setUp(self):
        sender.as_hex = "0x1111111111111111111111111111111111111111"
        self.c = module.DeliveryReceipt()
        self.c.create_brief("产品邮件验收", json.dumps(["正文包含售价 199 元", "包含购买行动号召"]))

    def delivery(self):
        self.c.submit_delivery("1", "折叠灯是用于桌面照明的产品，售价 199 元。点击立即购买，让桌面更明亮。")

    def answer(self, statuses=("met", "met"), evidence_id=1):
        gl.nondet.exec_prompt = lambda *a, **kw: json.dumps({"items": [
            {"status": s, "reason": "判断依据在交付文本中", "evidence_id": evidence_id if s == "met" else 0} for s in statuses
        ]})

    def test_other_wallet_cannot_replace_evidence(self):
        sender.as_hex = "0x2222222222222222222222222222222222222222"
        with self.assertRaises(VMError):
            self.delivery()
        self.assertEqual(json.loads(self.c.get_brief("1"))["status"], "open")

    def test_commitment_cannot_be_overwritten(self):
        self.delivery()
        before = self.c.get_brief("1")
        with self.assertRaises(VMError):
            self.c.submit_delivery("1", "另一个完全不同的交付版本，必须新建验收单后重新提交。")
        self.assertEqual(before, self.c.get_brief("1"))

    def test_hallucinated_quote_reverts_without_finalizing(self):
        self.delivery()
        self.answer(evidence_id=999)
        with self.assertRaises(VMError):
            self.c.evaluate("1")
        self.assertEqual(json.loads(self.c.get_brief("1"))["status"], "submitted")

    def test_missing_criterion_blocks_acceptance(self):
        self.delivery()
        self.answer(("met", "not_met"))
        self.c.evaluate("1")
        self.assertEqual(json.loads(self.c.get_brief("1"))["assessment"]["verdict"], "needs_revision")

    def test_unclear_is_not_a_pass(self):
        self.delivery()
        self.answer(("met", "unclear"))
        self.c.evaluate("1")
        self.assertEqual(json.loads(self.c.get_brief("1"))["assessment"]["verdict"], "insufficient_evidence")

    def test_successful_review_is_final_and_hash_is_bound(self):
        self.delivery()
        self.answer()
        self.c.evaluate("1")
        b = json.loads(self.c.get_brief("1"))
        self.assertEqual(b["assessment"]["verdict"], "accepted")
        self.assertEqual(b["evidence_sha256"], b["assessment"]["evidence_sha256"])
        with self.assertRaises(VMError):
            self.c.evaluate("1")

    def test_wrong_response_shape_is_rejected(self):
        self.delivery()
        self.answer(("met",))
        with self.assertRaises(VMError):
            self.c.evaluate("1")

    def test_duplicate_and_oversized_criteria_are_rejected(self):
        for items in [["重复标准一条", "重复标准一条"], ["a" * 501], []]:
            with self.assertRaises(VMError):
                self.c.create_brief("测试无效标准", json.dumps(items))

if __name__ == "__main__":
    unittest.main()
