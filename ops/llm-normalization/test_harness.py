#!/usr/bin/env python3
"""Offline/live test harness for the job-posting normalization prompt (prompt.md).

Usage:
    OPENAI_API_KEY=sk-... python3 test_harness.py

Without OPENAI_API_KEY set, prints a clear message and exits 0 rather than failing,
since this harness has not yet been run against a live key -- see README.md.
"""
import json
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
PROMPT_PATH = HERE / "prompt.md"
CASES_PATH = HERE / "test_cases.json"

# Fields that must match exactly (enums, booleans, numbers). Free-text fields like
# description_summary, skills, and city are intentionally excluded -- they're
# advisory and shouldn't fail the harness on stylistic differences.
STRICT_FIELDS = [
    "is_ma_eligible",
    "workplace_type",
    "facility_type",
    "job_function",
    "seniority",
    "is_founding_role",
    "technical_domain",
    "equity_tier",
    "salary_min",
    "salary_max",
    "salary_currency",
    "inferred_funding_stage",
    "inferred_primary_vertical",
    "inferred_secondary_verticals",
    "inferred_transit_corridor",
]


def extract_system_prompt(prompt_md_text: str) -> str:
    """Pulls the fenced ``` block directly under '## System message' in prompt.md."""
    match = re.search(
        r"## System message\s*```\s*(.*?)```", prompt_md_text, re.DOTALL
    )
    if not match:
        raise ValueError("Could not find '## System message' code block in prompt.md")
    return match.group(1).strip()


def build_user_message(job_url: str, raw_text: str) -> str:
    return (
        "Extract and normalize the following job posting content.\n\n"
        f"SOURCE URL: {job_url}\n\n"
        "RAW JOB POSTING CONTENT:\n"
        "-----------------------\n"
        f"{raw_text[:12000]}\n"
        "-----------------------"
    )


def run_case(client, system_prompt: str, case: dict) -> dict:
    user_message = build_user_message(case["job_url"], case["raw_text"])
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.0,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
    )
    return json.loads(response.choices[0].message.content)


def diff_case(case_id: str, expected: dict, actual: dict) -> list[str]:
    failures = []
    for field in STRICT_FIELDS:
        if field not in expected:
            continue  # not every case asserts every field
        exp_val = expected[field]
        act_val = actual.get(field)
        if isinstance(exp_val, list):
            if sorted(exp_val) != sorted(act_val or []):
                failures.append(f"  [{field}] expected {exp_val!r}, got {act_val!r}")
        elif exp_val != act_val:
            failures.append(f"  [{field}] expected {exp_val!r}, got {act_val!r}")
    return failures


def main() -> int:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print(
            "OPENAI_API_KEY is not set. This harness has not yet been run against a "
            "live model -- set the key and re-run before trusting prompt.md.\n"
            "Example: OPENAI_API_KEY=sk-... python3 test_harness.py"
        )
        return 0

    try:
        from openai import OpenAI
    except ImportError:
        print("The 'openai' package is required: pip install openai")
        return 1

    client = OpenAI(api_key=api_key)
    system_prompt = extract_system_prompt(PROMPT_PATH.read_text())
    cases = json.loads(CASES_PATH.read_text())["cases"]

    total = len(cases)
    passed = 0
    for case in cases:
        try:
            actual = run_case(client, system_prompt, case)
        except Exception as exc:  # noqa: BLE001 -- surface any API/parse failure per-case
            print(f"FAIL  {case['id']}  (error calling model: {exc})")
            continue

        failures = diff_case(case["id"], case["expected"], actual)
        if failures:
            print(f"FAIL  {case['id']}")
            for line in failures:
                print(line)
        else:
            print(f"PASS  {case['id']}")
            passed += 1

    print(f"\n{passed}/{total} cases passed strict-field comparison.")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
