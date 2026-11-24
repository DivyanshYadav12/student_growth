import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

SERVICE_DIR = Path(__file__).resolve().parents[1] / "service"
sys.path.insert(0, str(SERVICE_DIR))
import app as runner_app  # noqa: E402


class CodingApiContractTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(runner_app.app)

    def test_health_and_unknown_problem(self):
        self.assertEqual(self.client.get("/health").status_code, 200)
        response = self.client.post("/api/v1/coding/run", json={
            "problem_id": "unknown", "source_code": "int main(){}", "stdin": "",
        })
        self.assertEqual(response.status_code, 404)

    @patch.object(runner_app, "execute_cpp")
    def test_custom_run_returns_execution_output(self, execute_cpp):
        execute_cpp.return_value = {
            "status": "success", "stdout": "0 1", "stderr": "",
            "exit_code": 0, "execution_time_ms": 42,
        }
        response = self.client.post("/api/v1/coding/run", json={
            "problem_id": "two-sum", "source_code": "int main(){}", "stdin": "2\\n1 2\\n3\\n",
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["stdout"], "0 1")

    @patch.object(runner_app, "run_test_cases")
    def test_submit_returns_aggregate_hidden_counts_only(self, run_test_cases):
        problem = runner_app.PROBLEMS["two-sum"]
        total = len(problem["public"]) + len(problem["hidden"])
        results = [
            {"test_number": index, "passed": True, "expected_output": "x", "actual_output": "x", "execution_time_ms": 10, "status": "success"}
            for index in range(1, total + 1)
        ]
        run_test_cases.return_value = (results, None, total * 10)
        response = self.client.post("/api/v1/coding/submit", json={
            "problem_id": "two-sum", "source_code": "int main(){}",
        })
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["verdict"], "accepted")
        self.assertEqual(payload["hidden_passed"], len(problem["hidden"]))
        self.assertNotIn("hidden", payload)
        self.assertNotIn("input", payload)
        self.assertNotIn("expected_output", payload)


if __name__ == "__main__":
    unittest.main()
