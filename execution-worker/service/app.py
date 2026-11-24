from __future__ import annotations

import os
import re
import subprocess
import tempfile
import time
import uuid
from threading import BoundedSemaphore
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from problems import PROBLEMS

APP_VERSION = "0.1.0"
RUNNER_IMAGE = os.getenv("CODING_RUNNER_IMAGE", "student-growth-cpp-runner:latest")
DOCKER_BIN = os.getenv("DOCKER_BIN", "docker")
MAX_SOURCE_CHARS = 50_000
MAX_STDIN_CHARS = 12_000
MAX_OUTPUT_CHARS = 16_000
RUN_SLOTS = BoundedSemaphore(value=2)

app = FastAPI(title="Student Growth Coding Execution Service", version=APP_VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


class RunRequest(BaseModel):
    problem_id: str = Field(min_length=1, max_length=80, pattern=r"^[a-z0-9-]+$")
    source_code: str = Field(min_length=1, max_length=MAX_SOURCE_CHARS)
    stdin: str = Field(default="", max_length=MAX_STDIN_CHARS)


class CodeRequest(BaseModel):
    problem_id: str = Field(min_length=1, max_length=80, pattern=r"^[a-z0-9-]+$")
    source_code: str = Field(min_length=1, max_length=MAX_SOURCE_CHARS)


def normalized_output(value: str) -> str:
    return " ".join(value.strip().split())


def _parse_container_output(raw: str, marker: str) -> dict:
    compile_marker = f"__SG_{marker}_COMPILE_ERROR__\n"
    if compile_marker in raw:
        return {
            "status": "compile_error",
            "stdout": "",
            "stderr": raw.split(compile_marker, 1)[1][:MAX_OUTPUT_CHARS],
            "exit_code": None,
        }

    exit_match = re.search(re.escape(f"__SG_{marker}_EXIT_CODE__=") + r"(-?\d+)\n", raw)
    stdout_marker = f"__SG_{marker}_STDOUT_BEGIN__\n"
    stderr_marker = f"\n__SG_{marker}_STDERR_BEGIN__\n"
    if not exit_match or stdout_marker not in raw or stderr_marker not in raw:
        return {"status": "runtime_error", "stdout": "", "stderr": "Execution service returned an invalid runner response.", "exit_code": None}

    exit_code = int(exit_match.group(1))
    output_section = raw.split(stdout_marker, 1)[1]
    stdout, stderr = output_section.split(stderr_marker, 1)
    stdout = stdout[:MAX_OUTPUT_CHARS].strip("\n")
    stderr = stderr[:MAX_OUTPUT_CHARS].strip("\n")
    if exit_code in (124, 137, 143):
        status = "time_limit_exceeded"
    elif exit_code == 153:
        status = "output_limit_exceeded"
    elif exit_code != 0:
        status = "runtime_error"
    else:
        status = "success"
    return {"status": status, "stdout": stdout, "stderr": stderr, "exit_code": exit_code}


def execute_cpp(source_code: str, stdin: str) -> dict:
    """Compile and run C++17 inside a disposable, network-disabled Docker container."""
    with tempfile.TemporaryDirectory(prefix="student-growth-code-") as workspace:
        workspace_path = Path(workspace)
        source_path = workspace_path / "main.cpp"
        source_path.write_text(source_code, encoding="utf-8")
        try:
            # /work is bind-mounted writable so the compiled binary can exec
            # (Docker Desktop refuses exec from tmpfs when rootfs is read-only).
            os.chmod(workspace_path, 0o777)
            os.chmod(source_path, 0o644)
        except OSError:
            pass

        # The marker is unpredictable so solution output cannot spoof the runner protocol.
        marker = uuid.uuid4().hex
        compile_marker = f"__SG_{marker}_COMPILE_ERROR__"
        exit_marker = f"__SG_{marker}_EXIT_CODE__"
        stdout_marker = f"__SG_{marker}_STDOUT_BEGIN__"
        stderr_marker = f"__SG_{marker}_STDERR_BEGIN__"
        runner_script = (
            "set +e; "
            "g++ -std=c++17 -O2 -pipe /workspace/main.cpp -o /work/solution 2>/tmp/sg-compile.err; "
            "compile_rc=$?; "
            "if [ \"$compile_rc\" -ne 0 ]; then "
            f"printf '{compile_marker}\\n'; "
            "head -c 16000 /tmp/sg-compile.err; exit 0; fi; "
            "ulimit -f 128; "
            "timeout -k 1s 2s /work/solution >/tmp/sg-stdout 2>/tmp/sg-stderr; "
            "run_rc=$?; "
            f"printf '{exit_marker}=%s\\n' \"$run_rc\"; "
            f"printf '{stdout_marker}\\n'; head -c 64000 /tmp/sg-stdout; "
            f"printf '\\n{stderr_marker}\\n'; head -c 16000 /tmp/sg-stderr; "
        )
        command = [
            DOCKER_BIN, "run", "-i", "--init", "--rm", "--pull", "never",
            "--network", "none",
            "--memory", "256m", "--memory-swap", "256m", "--cpus", "0.5",
            "--pids-limit", "64", "--read-only",
            "--tmpfs", "/tmp:rw,nosuid,nodev,size=64m,mode=1777",
            "--user", "65534:65534", "--cap-drop", "ALL",
            "--security-opt", "no-new-privileges",
            "--ulimit", "cpu=5:5", "--ulimit", "fsize=16777216:16777216",
            "--ulimit", "nofile=64:64",
            "--mount", f"type=bind,source={workspace_path},target=/workspace,readonly",
            "--mount", f"type=bind,source={workspace_path},target=/work",
            "--workdir", "/workspace", "--entrypoint", "/bin/sh",
            RUNNER_IMAGE, "-lc", runner_script,
        ]
        started = time.perf_counter()
        try:
            completed = subprocess.run(
                command,
                input=stdin,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=10,
                check=False,
            )
        except FileNotFoundError as exc:
            raise HTTPException(status_code=503, detail="Docker CLI was not found. Install or start Docker Desktop, then restart this service.") from exc
        except subprocess.TimeoutExpired:
            return {"status": "time_limit_exceeded", "stdout": "", "stderr": "Compilation or execution exceeded the service time limit.", "exit_code": None, "execution_time_ms": int((time.perf_counter() - started) * 1000)}

        elapsed = int((time.perf_counter() - started) * 1000)
        if completed.returncode in (124, 137, 143, 152, 153):
            status = "output_limit_exceeded" if completed.returncode == 153 else "time_limit_exceeded" if completed.returncode in (124, 143, 152) else "runtime_error"
            note = "The container was terminated by a resource limit (possibly memory)." if completed.returncode == 137 else "The execution exceeded a resource limit."
            return {"status": status, "stdout": "", "stderr": note, "exit_code": completed.returncode, "execution_time_ms": elapsed}
        if completed.returncode != 0:
            detail = completed.stderr[-2000:].strip() or "Docker could not start the isolated runner. Check that the runner image is built and Docker is running."
            if "No such image" in detail or "pull access denied" in detail:
                raise HTTPException(status_code=503, detail=f"Runner image '{RUNNER_IMAGE}' is missing. Build it using the execution-worker instructions in README.md.")
            raise HTTPException(status_code=503, detail=f"Docker runner failed: {detail}")

        parsed = _parse_container_output(completed.stdout, marker)
        parsed["execution_time_ms"] = elapsed
        return parsed


def run_test_cases(source_code: str, test_cases: list[dict]) -> tuple[list[dict], str | None, int]:
    results: list[dict] = []
    total_runtime = 0
    terminal_verdict: str | None = None
    for index, case in enumerate(test_cases, start=1):
        execution = execute_cpp(source_code, case["input"])
        total_runtime += execution["execution_time_ms"]
        if execution["status"] == "compile_error":
            terminal_verdict = "compile_error"
        elif execution["status"] == "time_limit_exceeded":
            terminal_verdict = "time_limit_exceeded"
        elif execution["status"] == "output_limit_exceeded":
            terminal_verdict = "output_limit_exceeded"
        elif execution["status"] != "success":
            terminal_verdict = "runtime_error"
        passed = execution["status"] == "success" and normalized_output(execution["stdout"]) == normalized_output(case["output"])
        results.append({
            "test_number": index,
            "passed": passed,
            "expected_output": case["output"],
            "actual_output": execution["stdout"][:MAX_OUTPUT_CHARS],
            "execution_time_ms": execution["execution_time_ms"],
            "status": execution["status"],
        })
        if terminal_verdict:
            break
    return results, terminal_verdict, total_runtime


@app.get("/health")
def health():
    return {"status": "ok", "service": "student-growth-coding-runner", "version": APP_VERSION, "image": RUNNER_IMAGE}


def acquire_run_slot() -> None:
    if not RUN_SLOTS.acquire(blocking=False):
        raise HTTPException(status_code=429, detail="The local runner is busy. Wait for an active run to finish and try again.")


@app.post("/api/v1/coding/run")
def run_custom(request: RunRequest):
    if request.problem_id not in PROBLEMS:
        raise HTTPException(status_code=404, detail="Coding problem not found.")
    acquire_run_slot()
    try:
        return execute_cpp(request.source_code, request.stdin)
    finally:
        RUN_SLOTS.release()


@app.post("/api/v1/coding/run-samples")
def run_samples(request: CodeRequest):
    problem = PROBLEMS.get(request.problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Coding problem not found.")
    acquire_run_slot()
    try:
        results, terminal_verdict, total_runtime = run_test_cases(request.source_code, problem["public"])
        passed = sum(1 for item in results if item["passed"])
        if terminal_verdict:
            verdict = terminal_verdict
        else:
            verdict = "sample_passed" if passed == len(problem["public"]) else "sample_failed"
        return {"verdict": verdict, "passed_tests": passed, "total_tests": len(problem["public"]), "results": results, "execution_time_ms": total_runtime}
    finally:
        RUN_SLOTS.release()


@app.post("/api/v1/coding/submit")
def submit_solution(request: CodeRequest):
    problem = PROBLEMS.get(request.problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Coding problem not found.")
    acquire_run_slot()
    try:
        all_cases = problem["public"] + problem["hidden"]
        results, terminal_verdict, total_runtime = run_test_cases(request.source_code, all_cases)
        public_total = len(problem["public"])
        public_passed = sum(1 for item in results if item["test_number"] <= public_total and item["passed"])
        hidden_passed = sum(1 for item in results if item["test_number"] > public_total and item["passed"])
        passed = public_passed + hidden_passed
        if terminal_verdict:
            verdict = terminal_verdict
        elif passed == len(all_cases):
            verdict = "accepted"
        else:
            verdict = "wrong_answer"
        return {
            "submission_id": str(uuid.uuid4()),
            "verdict": verdict,
            "passed_tests": passed,
            "total_tests": len(all_cases),
            "public_passed": public_passed,
            "public_total": public_total,
            "hidden_passed": hidden_passed,
            "hidden_total": len(problem["hidden"]),
            "execution_time_ms": total_runtime,
            "xp_awarded": problem["xp"] if verdict == "accepted" else 0,
            "progress_lesson_id": problem["lesson_id"],
        }
    finally:
        RUN_SLOTS.release()
