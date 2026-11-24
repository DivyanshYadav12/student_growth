import sys
import unittest
from pathlib import Path

SERVICE_DIR = Path(__file__).resolve().parents[1] / "service"
sys.path.insert(0, str(SERVICE_DIR))
from problems import PROBLEMS  # noqa: E402


def solve_reference(problem_id: str, stdin: str) -> str:
    values = list(map(int, stdin.split()))
    if problem_id == "two-sum":
        n = values[0]
        nums = values[1 : 1 + n]
        target = values[1 + n]
        for left in range(n):
            for right in range(left + 1, n):
                if nums[left] + nums[right] == target:
                    return f"{left} {right}"
    elif problem_id == "max-window-sum":
        n, k = values[0], values[1]
        nums = values[2 : 2 + n]
        return str(max(sum(nums[start : start + k]) for start in range(n - k + 1)))
    elif problem_id == "contains-duplicate":
        n = values[0]
        nums = values[1 : 1 + n]
        return "true" if len(set(nums)) != len(nums) else "false"
    elif problem_id == "binary-search-first":
        n, target = values[0], values[1]
        nums = values[2 : 2 + n]
        try:
            return str(nums.index(target))
        except ValueError:
            return "-1"
    raise AssertionError(f"No reference solution for {problem_id}")


class ProblemFixtureTests(unittest.TestCase):
    def test_all_public_and_hidden_expected_outputs(self):
        for problem_id, problem in PROBLEMS.items():
            for suite_name in ("public", "hidden"):
                for case_index, case in enumerate(problem[suite_name], start=1):
                    with self.subTest(problem=problem_id, suite=suite_name, case=case_index):
                        actual = " ".join(solve_reference(problem_id, case["input"]).split())
                        expected = " ".join(case["output"].split())
                        self.assertEqual(actual, expected)

    def test_hidden_cases_are_not_empty(self):
        for problem_id, problem in PROBLEMS.items():
            with self.subTest(problem=problem_id):
                self.assertGreaterEqual(len(problem["hidden"]), 3)

    def test_all_problem_mappings_have_lesson_and_xp(self):
        for problem_id, problem in PROBLEMS.items():
            with self.subTest(problem=problem_id):
                self.assertTrue(problem["lesson_id"])
                self.assertGreater(problem["xp"], 0)


if __name__ == "__main__":
    unittest.main()
