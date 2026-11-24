"""Server-owned coding challenge cases. Hidden cases must never be sent to the frontend."""

PROBLEMS = {
    "two-sum": {
        "xp": 120,
        "lesson_id": "arrays-two-sum",
        "public": [
            {"input": "4\n2 7 11 15\n9\n", "output": "0 1"},
            {"input": "3\n3 2 4\n6\n", "output": "1 2"},
            {"input": "3\n3 3 2\n6\n", "output": "0 1"},
        ],
        "hidden": [
            {"input": "2\n-5 5\n0\n", "output": "0 1"},
            {"input": "5\n10 1 8 3 7\n10\n", "output": "3 4"},
            {"input": "6\n1000000000 -1000000000 4 8 2 6\n0\n", "output": "0 1"},
        ],
    },
    "max-window-sum": {
        "xp": 130,
        "lesson_id": "arrays-sliding-window",
        "public": [
            {"input": "5 3\n1 2 3 4 5\n", "output": "12"},
            {"input": "6 2\n-5 -2 -3 -4 -1 -6\n", "output": "-5"},
        ],
        "hidden": [
            {"input": "1 1\n-99\n", "output": "-99"},
            {"input": "8 4\n5 -1 3 2 -8 7 4 1\n", "output": "9"},
            {"input": "6 6\n2 3 -1 4 5 -2\n", "output": "11"},
        ],
    },
    "contains-duplicate": {
        "xp": 100,
        "lesson_id": "hash-set-basics",
        "public": [
            {"input": "4\n1 2 3 1\n", "output": "true"},
            {"input": "4\n1 2 3 4\n", "output": "false"},
        ],
        "hidden": [
            {"input": "1\n7\n", "output": "false"},
            {"input": "5\n-1 -2 -3 -4 -1\n", "output": "true"},
            {"input": "6\n1000000000 0 -1000000000 2 3 4\n", "output": "false"},
        ],
    },
    "binary-search-first": {
        "xp": 140,
        "lesson_id": "binary-search",
        "public": [
            {"input": "7 2\n1 2 2 2 4 5 8\n", "output": "1"},
            {"input": "5 7\n1 2 3 4 5\n", "output": "-1"},
        ],
        "hidden": [
            {"input": "0 5\n\n", "output": "-1"},
            {"input": "1 4\n4\n", "output": "0"},
            {"input": "8 9\n1 3 5 7 9 9 9 10\n", "output": "4"},
        ],
    },
}
