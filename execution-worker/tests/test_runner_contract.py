import sys
import unittest
from pathlib import Path
from unittest.mock import patch

SERVICE_DIR = Path(__file__).resolve().parents[1] / "service"
sys.path.insert(0, str(SERVICE_DIR))
import app as runner_app  # noqa: E402


class RunnerContractTests(unittest.TestCase):
    def test_container_success_output_is_parsed(self):
        marker = "unit-test-marker"
        raw = f"__SG_{marker}_EXIT_CODE__=0\n__SG_{marker}_STDOUT_BEGIN__\nhello\n__SG_{marker}_STDERR_BEGIN__\n"
        result = runner_app._parse_container_output(raw, marker)
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["stdout"], "hello")
        self.assertEqual(result["exit_code"], 0)

    def test_compile_errors_are_classified(self):
        marker = "unit-test-marker"
        result = runner_app._parse_container_output(f"__SG_{marker}_COMPILE_ERROR__\nmain.cpp: error: expected ';'", marker)
        self.assertEqual(result["status"], "compile_error")
        self.assertIn("expected", result["stderr"])

    @patch.object(runner_app.subprocess, "run")
    def test_container_is_launched_with_isolation_flags(self, mocked_run):
        mocked_run.return_value = runner_app.subprocess.CompletedProcess(
            args=["docker"], returncode=0,
            stdout="__SG_mock_marker_EXIT_CODE__=0\n__SG_mock_marker_STDOUT_BEGIN__\nok\n__SG_mock_marker_STDERR_BEGIN__\n",
            stderr="",
        )
        with patch.object(runner_app.uuid, "uuid4") as uuid4:
            uuid4.return_value.hex = "mock_marker"
            result = runner_app.execute_cpp("#include <iostream>\nint main(){std::cout << \"ok\";}", "")
        args = mocked_run.call_args.args[0]
        self.assertEqual(result["status"], "success")
        self.assertIn("-i", args)
        self.assertIn("--init", args)
        self.assertEqual(args[args.index("--network") + 1], "none")
        self.assertIn("--read-only", args)
        self.assertEqual(args[args.index("--user") + 1], "65534:65534")
        self.assertIn("--cap-drop", args)
        self.assertIn("no-new-privileges", args)
        self.assertIn("--pids-limit", args)


if __name__ == "__main__":
    unittest.main()
