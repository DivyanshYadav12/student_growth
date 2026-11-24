"""Idempotent seed data for the Student Growth Platform.

Run from the backend directory:
    .venv/Scripts/python scripts/seed.py

Safe to re-run: every record is looked up by its natural key (slug/code)
before insertion.
"""

import asyncio
import sys
from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.core.security import hash_password
from app.database import SessionLocal
from app.models.academics import (
    AcademicProgram,
    AcademicResource,
    AcademicSemester,
    AcademicSubject,
    CurriculumVersion,
    SemesterSubject,
    SyllabusUnit,
)
from app.models.assessments import Assessment
from app.models.career import CareerPath, CareerPathSkill, Project
from app.models.coding import CodingProblem, CodingTestCase
from app.models.gamification import Achievement
from app.models.identity import Role, User, UserProfile, UserPreference, UserRole
from app.models.learning import (
    LearningPath,
    LearningPathNode,
    LearningPathNodePrerequisite,
    Lesson,
    Skill,
    SkillPrerequisite,
)


async def get_or_create(session, model, lookup: dict, defaults: dict | None = None):
    result = await session.execute(select(model).filter_by(**lookup))
    obj = result.scalar_one_or_none()
    if obj is not None:
        return obj, False
    obj = model(**{**lookup, **(defaults or {})})
    session.add(obj)
    await session.flush()
    return obj, True


async def seed_identity(session) -> User:
    admin, created = await get_or_create(
        session,
        User,
        {"email": "admin@studentgrowth.local"},
        {
            "password_hash": hash_password("admin-dev-password"),
            "full_name": "Platform Admin",
            "status": "active",
            "email_verified_at": datetime.now(timezone.utc),
        },
    )
    await get_or_create(session, UserProfile, {"user_id": admin.id}, {})
    await get_or_create(session, UserPreference, {"user_id": admin.id}, {})

    admin_role = (await session.execute(select(Role).where(Role.code == "admin"))).scalar_one()
    existing = await session.execute(
        select(UserRole).where(UserRole.user_id == admin.id, UserRole.role_id == admin_role.id)
    )
    if existing.scalar_one_or_none() is None:
        session.add(UserRole(user_id=admin.id, role_id=admin_role.id))
        await session.flush()

    print(f"  {'created' if created else 'exists '} admin user: {admin.email} (password: admin-dev-password)")
    return admin


# ---------------------------------------------------------------------------
# Academics
# ---------------------------------------------------------------------------

SEMESTERS = [
    (1, "Foundation Semester"),
    (2, "Engineering Sciences"),
    (3, "Core CS - Part 1"),
    (4, "Core CS - Part 2"),
    (5, "Core CS - Part 3"),
    (6, "Specialization"),
    (7, "Advanced Topics"),
    (8, "Capstone & Internship"),
]

# (semester_number, local_code, title, credits, subject_type, units)
SUBJECTS = [
    (1, "CS101", "Programming for Problem Solving", 4, "core", [
        "Introduction to Programming & Flowcharts",
        "C Programming Fundamentals",
        "Control Structures & Functions",
        "Arrays, Strings & Basic Problem Solving",
    ]),
    (1, "MA101", "Engineering Mathematics - I", 4, "core", [
        "Differential Calculus",
        "Integral Calculus",
        "Ordinary Differential Equations",
        "Vector Calculus & Directional Derivatives",
    ]),
    (2, "CS201", "Object-Oriented Programming", 4, "core", [
        "Introduction to OOP Concepts",
        "Classes, Objects & Constructors",
        "Inheritance, Polymorphism & Abstraction",
        "Exception Handling & File I/O",
    ]),
    (2, "MA201", "Engineering Mathematics - II", 4, "core", [
        "Linear Algebra & Matrices",
        "Fourier Series",
        "Z-Transforms",
        "Probability & Random Variables",
    ]),
    (3, "CS301", "Data Structures", 4, "core", [
        "Introduction and Elementary Data Structures",
        "Linked Lists",
        "Trees",
        "Graph Theory",
        "Sorting and Searching Algorithms",
    ]),
    (3, "CS302", "Digital Logic & Computer Organization", 4, "core", [
        "Number Systems & Boolean Algebra",
        "Combinational & Sequential Circuits",
        "CPU Organization & Instruction Sets",
        "Memory Hierarchy & I/O Organization",
    ]),
    (4, "CS401", "Database Management Systems", 4, "core", [
        "Introduction to Database Systems",
        "Entity-Relationship Model",
        "Relational Algebra & SQL",
        "Normalization & Integrity Constraints",
        "Transactions & Concurrency Control",
    ]),
    (4, "CS402", "Operating Systems", 4, "core", [
        "OS Concepts & System Structures",
        "Processes, Threads & CPU Scheduling",
        "Process Synchronization",
        "Memory Management & Virtual Memory",
        "File Systems & I/O Management",
    ]),
    (5, "CS501", "Computer Networks", 4, "core", [
        "Network Fundamentals & OSI/TCP-IP Models",
        "Data Link Layer",
        "Network Layer - IP & Routing",
        "Transport Layer - TCP & UDP",
        "Application Layer Protocols",
    ]),
    (5, "CS502", "Software Engineering", 4, "core", [
        "Software Process Models",
        "Requirements Engineering",
        "Software Design Principles",
        "Software Testing & Maintenance",
    ]),
    (6, "CS601", "Design & Analysis of Algorithms", 4, "core", [
        "Algorithm Analysis & Notations",
        "Greedy Algorithms",
        "Divide & Conquer",
        "Dynamic Programming",
        "Graph Algorithms - BFS, DFS, MST, Shortest Paths",
    ]),
    (6, "CS602", "Theory of Computation", 3, "core", [
        "Regular Languages & Finite Automata",
        "Context-Free Languages & Pushdown Automata",
        "Turing Machines & Computability",
        "Complexity Classes - P, NP",
    ]),
    (7, "CS701", "Web Technologies", 3, "elective", [
        "HTML, CSS & Client-Side Scripting",
        "Client-Server Architecture",
        "REST API Design",
        "Web Security Basics",
    ]),
    (7, "CS702", "Machine Learning", 3, "elective", [
        "Introduction to Machine Learning",
        "Supervised Learning - Regression",
        "Supervised Learning - Classification",
        "Model Evaluation & Overfitting",
    ]),
    (8, "CS801", "Final Year Project", 6, "project", [
        "Project Proposal & Literature Review",
        "System Design & Implementation",
        "Testing, Documentation & Deployment",
        "Project Report & Viva Preparation",
    ]),
    (8, "CS802", "Industrial Internship", 2, "elective", [
        "Internship Training & Industry Practices",
        "Internship Report & Evaluation",
    ]),
]


async def seed_curriculum(session, admin: User) -> dict[int, list]:
    program, _ = await get_or_create(
        session,
        AcademicProgram,
        {"code": "btech-cse"},
        {
            "degree_name": "Bachelor of Technology",
            "branch_name": "Computer Science and Engineering",
            "scope": "global",
            "description": (
                "Generic reference B.Tech CSE curriculum. This is NOT the official "
                "syllabus of any specific university - institutions should map it "
                "to their own curriculum versions."
            ),
        },
    )

    curriculum, _ = await get_or_create(
        session,
        CurriculumVersion,
        {"program_id": program.id, "version_name": "Generic CSE Reference 2026"},
        {"status": "published", "effective_from_year": 2026},
    )
    curriculum.status = "published"

    semesters = {}
    for number, title in SEMESTERS:
        sem, _ = await get_or_create(
            session,
            AcademicSemester,
            {"curriculum_version_id": curriculum.id, "semester_number": number},
            {"title": title},
        )
        semesters[number] = sem

    offerings_by_semester: dict[int, list] = {n: [] for n in semesters}
    subject_count = 0
    unit_count = 0

    for sem_no, code, title, credits, stype, unit_titles in SUBJECTS:
        subject, _ = await get_or_create(
            session,
            AcademicSubject,
            {"canonical_code": code},
            {"title": title, "subject_area": "Computer Science"},
        )

        offering, created = await get_or_create(
            session,
            SemesterSubject,
            {"semester_id": semesters[sem_no].id, "subject_id": subject.id},
            {
                "local_subject_code": code,
                "credits": Decimal(str(credits)),
                "subject_type": stype,
                "display_order": len(offerings_by_semester[sem_no]),
            },
        )
        if created:
            subject_count += 1

        for idx, unit_title in enumerate(unit_titles, start=1):
            detail = UNIT_DETAILS.get(unit_title)
            _, created_unit = await get_or_create(
                session,
                SyllabusUnit,
                {"semester_subject_id": offering.id, "unit_number": idx},
                {
                    "title": unit_title,
                    "description": detail[0] if detail else None,
                    "learning_outcomes": detail[1] if detail else [f"Understand and apply core concepts of {unit_title}"],
                    "display_order": idx,
                },
            )
            if created_unit:
                unit_count += 1

        offerings_by_semester[sem_no].append(offering)

    print(f"  curriculum: 1 program, 1 version, {len(semesters)} semesters, {subject_count} subjects, {unit_count} units")
    return {"program": program, "curriculum": curriculum, "semesters": semesters, "offerings": offerings_by_semester}


# Real semester-3 DSA syllabus detail (COs + unit descriptions), keyed by unit title.
UNIT_DETAILS = {
    "Introduction and Elementary Data Structures": (
        "Introduction to data structures and data types, efficient use of memory, recursion, "
        "time and space complexity of algorithms, Big O and theta notations. Elementary data "
        "structures: stacks, queues, infix/postfix/prefix conversions, evaluation of "
        "expressions, priority queues, double ended queues, and their implementations.",
        ["CO1: Identify and understand various data structures implementable in different languages",
         "CO4: Understand recursion, its application, implementation and removal"],
    ),
    "Linked Lists": (
        "Introduction to linked lists, linked stacks and queues, array and dynamic "
        "implementation of singly linked lists, doubly and circularly linked lists, polynomial "
        "addition, sparse matrices, applications of stacks/queues/linked lists, garbage collection.",
        ["CO5: Apply efficient data structures (linked lists, stacks, queues) to solve problems",
         "CO3: Design, implement, test and debug programs using a range of data structures"],
    ),
    "Trees": (
        "Basic terminology, binary trees, traversals, array and linked representations, "
        "applications of trees, threaded trees, binary search tree, AVL tree and B-tree.",
        ["CO3: Design, implement, test and debug programs using binary trees, search trees and graphs"],
    ),
    "Graph Theory": (
        "Basic terminology, sequential and linked representations of graphs, graph traversals, "
        "Dijkstra's algorithm for shortest path, Prim's and Kruskal's algorithms for MST.",
        ["CO3: Design, implement, test and debug programs using graph data structures"],
    ),
    "Sorting and Searching Algorithms": (
        "Searching: linear, binary and hash search. Sorting: insertion, selection, bubble, "
        "quick, merge, heap and bucket sort.",
        ["CO2: Select appropriate data structures and evaluate efficiency trade-offs including runtime"],
    ),
}


# ---------------------------------------------------------------------------
# Skills, lessons, learning path
# ---------------------------------------------------------------------------

SKILLS = [
    ("cpp-fundamentals", "C++ Fundamentals", "Write correct, idiomatic C++17 programs: I/O, types, control flow, functions.", "Programming", "beginner"),
    ("complexity-analysis", "Complexity Analysis", "Estimate time and space complexity using Big-O notation.", "Problem Solving", "beginner"),
    ("arrays-strings", "Arrays & Strings", "Traverse, transform, and reason about contiguous data.", "DSA", "beginner"),
    ("hashing", "Hashing", "Use hash maps and hash sets for O(1) average lookups.", "DSA", "beginner"),
    ("two-pointers-sliding-window", "Two Pointers & Sliding Window", "Solve array problems in a single pass with window techniques.", "DSA", "intermediate"),
    ("linear-structures", "Linked Lists, Stacks & Queues", "Understand pointer-based and linear data structures.", "DSA", "intermediate"),
    ("binary-search", "Binary Search", "Apply binary search on sorted data and answer boundary questions.", "DSA", "intermediate"),
    ("trees-graphs", "Trees & Graphs", "Traverse trees and graphs; understand BFS/DFS intuitions.", "DSA", "advanced"),
]

# skill_code -> list of (slug, title, summary, minutes, difficulty, markdown)
LESSONS = {
    "cpp-fundamentals": [
        ("cpp-io-basics", "Variables, types & input/output", "Represent values, read input, and print formatted output.", 25, "beginner",
         "## Objectives\n- Choose suitable primitive types for common values.\n- Read input with `cin` and display output with `cout`.\n\n## Explanation\nEvery C++ program starts in `main()`. Use `ios::sync_with_stdio(false); cin.tie(nullptr);` for fast I/O in competitive-style problems.\n\n## Example\n```cpp\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a + b << '\\n';\n}\n```\n\n## Practice\nRead three integers and print their sum and average."),
        ("cpp-control-flow", "Conditions & loops", "Use if/else, for, while, and nested loops to control program flow.", 35, "beginner",
         "## Objectives\n- Choose between `if/else`, `switch`, and loops.\n- Trace loop variables through iterations.\n- Avoid off-by-one errors.\n\n## Explanation\nA loop needs a clear initialization, condition, and update. Use braces consistently.\n\n## Example\n```cpp\nfor (int i = 1; i <= n; ++i) cout << i << ' ';\n```\n\n## Practice\nPrint all even numbers from 1 through n, then calculate their sum."),
        ("cpp-functions", "Functions & modular thinking", "Break a problem into small functions with clear inputs and outputs.", 40, "beginner",
         "## Objectives\n- Define and call functions.\n- Pass values and return results.\n- Separate problem logic into reusable steps.\n\n## Explanation\nA function should have one clear responsibility. Prefer meaningful names.\n\n## Example\n```cpp\nbool isEven(int number) { return number % 2 == 0; }\n```\n\n## Practice\nWrite a function that returns the largest of three integers."),
    ],
    "complexity-analysis": [
        ("big-o-basics", "Time & space complexity", "Estimate how runtime and memory grow as input size increases.", 30, "beginner",
         "## Objectives\n- Explain input size and growth rate.\n- Recognize O(1), O(n), O(n log n), and O(n²).\n\n## Explanation\nBig-O describes growth, not exact runtime. Nested loops often multiply iteration counts.\n\n## Example\n```cpp\n// O(n)\nfor (int i = 0; i < n; ++i) { /* work */ }\n// O(n^2)\nfor (int i = 0; i < n; ++i)\n  for (int j = 0; j < n; ++j) { /* work */ }\n```\n\n## Practice\nClassify a loop that halves n on every iteration."),
    ],
    "arrays-strings": [
        ("arrays-basics", "Working with arrays & vectors", "Traverse contiguous collections safely.", 30, "beginner",
         "## Objectives\n- Declare and traverse arrays and vectors.\n- Understand zero-based indexing.\n- Pass vectors by reference when mutation is intended.\n\n## Explanation\nA vector stores elements contiguously and grows dynamically. Valid indices run from 0 to size-1.\n\n## Example\n```cpp\nint largest = nums[0];\nfor (int v : nums) largest = max(largest, v);\n```\n\n## Practice\nRead n numbers and print the minimum and maximum."),
        ("two-sum-patterns", "Two Sum patterns", "Use hashing to find pairs in one pass.", 35, "beginner",
         "## Objectives\n- Reformulate pair problems as complement lookups.\n- Use `unordered_map` for O(1) average lookups.\n\n## Explanation\nFor each element, check whether `target - value` was already seen.\n\n## Practice\nSolve Two Sum, then try the 3Sum variant on paper."),
        ("sliding-window", "Sliding window fundamentals", "Maintain a fixed-size window in O(n).", 35, "beginner",
         "## Objectives\n- Identify when a window technique applies.\n- Add/remove elements in O(1) per step.\n\n## Explanation\nGrow the window, then shrink it while the invariant holds. Each element enters and leaves once.\n\n## Practice\nFind the maximum sum of any contiguous subarray of size k."),
    ],
    "hashing": [
        ("hash-set-basics", "Hash sets & duplicate detection", "Detect duplicates and membership in O(1) average time.", 25, "beginner",
         "## Objectives\n- Use `unordered_set` for membership tests.\n- Understand average vs worst-case hashing.\n\n## Explanation\nInsert each value; if insertion fails, a duplicate exists.\n\n## Practice\nSolve Contains Duplicate, then extend it to return the first repeated index."),
    ],
    "two-pointers-sliding-window": [
        ("two-pointers-technique", "Two pointers technique", "Traverse sorted or paired data with two indices.", 30, "intermediate",
         "## Objectives\n- Apply opposite-end and same-direction pointers.\n- Recognize sorted-input pair problems.\n\n## Explanation\nMove the pointer that reduces the search space based on the comparison result.\n\n## Practice\nSolve 3Sum using sorting + two pointers."),
    ],
    "linear-structures": [
        ("linked-list-basics", "Linked lists demystified", "Understand nodes, pointers, and traversal.", 35, "intermediate",
         "## Objectives\n- Draw and traverse singly linked lists.\n- Implement insertion and deletion.\n\n## Explanation\nEach node holds data plus a pointer to the next node; traversal is O(n).\n\n## Practice\nImplement reverse a linked list iteratively."),
    ],
    "binary-search": [
        ("binary-search", "Binary search & boundaries", "Find first/last occurrences and lower bounds.", 35, "intermediate",
         "## Objectives\n- Implement lower_bound/upper_bound manually.\n- Handle empty arrays and duplicates.\n\n## Explanation\nMaintain [lo, hi) invariants; decide which half to discard each step.\n\n## Practice\nFind the first occurrence of a target in a sorted array with duplicates."),
    ],
    "trees-graphs": [
        ("trees-intro", "Trees & graphs - first look", "Understand hierarchies and connectivity.", 40, "advanced",
         "## Objectives\n- Distinguish trees from graphs.\n- Traverse trees with recursion and BFS/DFS.\n\n## Explanation\nTrees are connected acyclic graphs; graphs allow cycles and multiple paths.\n\n## Practice\nDraw the BFS order of a small binary tree."),
    ],
}


async def seed_learning(session, admin: User):
    skills = {}
    for code, name, desc, category, difficulty in SKILLS:
        skill, _ = await get_or_create(
            session,
            Skill,
            {"code": code},
            {"name": name, "description": desc, "category": category, "difficulty": difficulty},
        )
        skills[code] = skill

    # Prerequisite chain: each skill requires the previous one (advisory).
    codes = [c for c, *_ in SKILLS]
    for prev, cur in zip(codes, codes[1:]):
        existing = await session.execute(
            select(SkillPrerequisite).where(
                SkillPrerequisite.skill_id == skills[cur].id,
                SkillPrerequisite.prerequisite_skill_id == skills[prev].id,
            )
        )
        if existing.scalar_one_or_none() is None:
            session.add(SkillPrerequisite(skill_id=skills[cur].id, prerequisite_skill_id=skills[prev].id))

    lessons = {}
    for skill_code, lesson_list in LESSONS.items():
        for slug, title, summary, minutes, difficulty, markdown in lesson_list:
            lesson, _ = await get_or_create(
                session,
                Lesson,
                {"slug": slug},
                {
                    "skill_id": skills[skill_code].id,
                    "title": title,
                    "summary": summary,
                    "estimated_minutes": minutes,
                    "difficulty": difficulty,
                    "status": "published",
                    "content_markdown": markdown,
                    "created_by_user_id": admin.id,
                    "published_at": datetime.now(timezone.utc),
                },
            )
            lessons[slug] = lesson

    path, _ = await get_or_create(
        session,
        LearningPath,
        {"slug": "cpp-dsa-foundations"},
        {
            "title": "C++ & DSA Foundations",
            "description": (
                "Build strong C++ fundamentals, learn to reason about time and space "
                "complexity, and solve your first data-structure problems with confidence. "
                "Nodes unlock in order - finish a topic before moving to the next."
            ),
            "category": "Software Engineering",
            "difficulty": "beginner",
            "estimated_hours": Decimal("36"),
            "owner_type": "platform",
            "created_by_user_id": admin.id,
            "visibility": "public",
            "status": "published",
            "published_at": datetime.now(timezone.utc),
        },
    )

    # Nodes: one node per skill, in curriculum order; each node's prerequisite is
    # the previous node so progress feels like unlocking stages.
    node_ids = []
    for order, code in enumerate(codes):
        node, created = await get_or_create(
            session,
            LearningPathNode,
            {"learning_path_id": path.id, "display_order": order},
            {
                "node_type": "skill",
                "skill_id": skills[code].id,
                "display_order": order,
                "is_required": True,
            },
        )
        node_ids.append(node.id)

    for prev_id, cur_id in zip(node_ids, node_ids[1:]):
        existing = await session.execute(
            select(LearningPathNodePrerequisite).where(
                LearningPathNodePrerequisite.node_id == cur_id,
                LearningPathNodePrerequisite.prerequisite_node_id == prev_id,
            )
        )
        if existing.scalar_one_or_none() is None:
            session.add(
                LearningPathNodePrerequisite(node_id=cur_id, prerequisite_node_id=prev_id)
            )

    await session.flush()
    print(
        f"  learning: {len(skills)} skills, {len(lessons)} lessons, "
        f"1 path ({len(node_ids)} nodes)"
    )
    return {"path": path, "skills": skills, "lessons": lessons}


# ---------------------------------------------------------------------------
# Coding problems (mirrors execution-worker/service/problems.py test cases)
# ---------------------------------------------------------------------------

CODING_PROBLEMS = [
    {
        "slug": "two-sum",
        "title": "Two Sum",
        "skill": "arrays-strings",
        "difficulty": "easy",
        "statement": (
            "Given an array of integers and an integer target, return the indices of "
            "the two distinct elements whose values add up to target.\n\n"
            "You may assume that exactly one valid pair exists. Return the smaller "
            "index first. You must not use the same element twice."
        ),
        "constraints": "2 ≤ n ≤ 100,000\n-1,000,000,000 ≤ nums[i], target ≤ 1,000,000,000\nExactly one valid answer exists.",
        "input_format": "The first line contains n.\nThe second line contains n space-separated integers.\nThe third line contains target.",
        "output_format": "Print the two zero-based indices in ascending order, separated by one space.",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "starter_code": """#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; ++i) cin >> nums[i];
    int target;
    cin >> target;

    // TODO: Find the pair and print the two indices.

    return 0;
}
""",
        "editorial": "Store each value's index in a hash map. For each element, check if `target - value` exists in the map. O(n) time, O(n) space.",
        "samples": [
            ("4\n2 7 11 15\n9\n", "0 1"),
            ("3\n3 2 4\n6\n", "1 2"),
            ("3\n3 3 2\n6\n", "0 1"),
        ],
        "hidden": [
            ("2\n-5 5\n0\n", "0 1"),
            ("5\n10 1 8 3 7\n10\n", "3 4"),
            ("6\n1000000000 -1000000000 4 8 2 6\n0\n", "0 1"),
        ],
    },
    {
        "slug": "max-window-sum",
        "title": "Maximum Sum Subarray of Size K",
        "skill": "two-pointers-sliding-window",
        "difficulty": "easy",
        "statement": (
            "Given an integer array nums and an integer k, find the maximum sum of any "
            "contiguous subarray containing exactly k elements.\n\n"
            "The array may contain negative values. A valid window always exists."
        ),
        "constraints": "1 ≤ k ≤ n ≤ 200,000\n-10,000 ≤ nums[i] ≤ 10,000",
        "input_format": "The first line contains n and k.\nThe second line contains n space-separated integers.",
        "output_format": "Print the maximum sum as a 64-bit integer.",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "starter_code": """#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, k;
    cin >> n >> k;
    vector<long long> nums(n);
    for (int i = 0; i < n; ++i) cin >> nums[i];

    // TODO: Maintain a fixed-size sliding window.

    return 0;
}
""",
        "editorial": "Compute the sum of the first k elements, then slide: subtract the outgoing element and add the incoming one. Track the maximum. O(n) time, O(1) extra space.",
        "samples": [
            ("5 3\n1 2 3 4 5\n", "12"),
            ("6 2\n-5 -2 -3 -4 -1 -6\n", "-5"),
        ],
        "hidden": [
            ("1 1\n-99\n", "-99"),
            ("8 4\n5 -1 3 2 -8 7 4 1\n", "9"),
            ("6 6\n2 3 -1 4 5 -2\n", "11"),
        ],
    },
    {
        "slug": "contains-duplicate",
        "title": "Contains Duplicate",
        "skill": "hashing",
        "difficulty": "easy",
        "statement": (
            "Given an integer array nums, return true if any value appears at least "
            "twice, and false if every element is distinct.\n\n"
            "Print the lowercase word true or false."
        ),
        "constraints": "1 ≤ n ≤ 200,000\n-1,000,000,000 ≤ nums[i] ≤ 1,000,000,000",
        "input_format": "The first line contains n.\nThe second line contains n space-separated integers.",
        "output_format": "Print true if a duplicate exists; otherwise print false.",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "starter_code": """#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    unordered_set<int> seen;
    bool hasDuplicate = false;

    for (int i = 0; i < n; ++i) {
        int value;
        cin >> value;
        // TODO: Check whether value is already in seen.
        seen.insert(value);
    }

    cout << (hasDuplicate ? "true" : "false") << "\\n";
    return 0;
}
""",
        "editorial": "Insert each value into an unordered_set. If insert returns false, the value was already present. O(n) average time, O(n) space.",
        "samples": [
            ("4\n1 2 3 1\n", "true"),
            ("4\n1 2 3 4\n", "false"),
        ],
        "hidden": [
            ("1\n7\n", "false"),
            ("5\n-1 -2 -3 -4 -1\n", "true"),
            ("6\n1000000000 0 -1000000000 2 3 4\n", "false"),
        ],
    },
    {
        "slug": "binary-search-first",
        "title": "First Occurrence in a Sorted Array",
        "skill": "binary-search",
        "difficulty": "medium",
        "statement": (
            "Given a non-decreasing array nums and a target value, return the first "
            "(smallest) index at which target occurs.\n\n"
            "If target does not appear, print -1. The array can contain duplicate values."
        ),
        "constraints": "0 ≤ n ≤ 200,000\n-1,000,000,000 ≤ nums[i], target ≤ 1,000,000,000\nnums is sorted in non-decreasing order.",
        "input_format": "The first line contains n and target.\nThe second line contains n sorted integers. If n is zero, the second line may be empty.",
        "output_format": "Print the zero-based first index, or -1.",
        "time_limit_ms": 2000,
        "memory_limit_mb": 256,
        "starter_code": """#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, target;
    cin >> n >> target;
    vector<int> nums(n);
    for (int i = 0; i < n; ++i) cin >> nums[i];

    // TODO: Use binary search to find the first occurrence.

    return 0;
}
""",
        "editorial": "Binary search for the lower bound: when nums[mid] == target, record mid and continue searching the left half. O(log n) time, O(1) space.",
        "samples": [
            ("7 2\n1 2 2 2 4 5 8\n", "1"),
            ("5 7\n1 2 3 4 5\n", "-1"),
        ],
        "hidden": [
            ("0 5\n\n", "-1"),
            ("1 4\n4\n", "0"),
            ("8 9\n1 3 5 7 9 9 9 10\n", "4"),
        ],
    },
]


async def seed_coding(session, skills: dict):
    count = 0
    for spec in CODING_PROBLEMS:
        problem, _ = await get_or_create(
            session,
            CodingProblem,
            {"slug": spec["slug"]},
            {
                "skill_id": skills[spec["skill"]].id,
                "title": spec["title"],
                "statement_markdown": spec["statement"],
                "difficulty": spec["difficulty"],
                "supported_languages": ["cpp"],
                "constraints_text": spec["constraints"],
                "input_format": spec["input_format"],
                "output_format": spec["output_format"],
                "time_limit_ms": spec["time_limit_ms"],
                "memory_limit_mb": spec["memory_limit_mb"],
                "starter_code": spec["starter_code"],
                "editorial_markdown": spec["editorial"],
                "status": "published",
            },
        )

        for order, (inp, out) in enumerate(spec["samples"]):
            existing = await session.execute(
                select(CodingTestCase).where(
                    CodingTestCase.problem_id == problem.id,
                    CodingTestCase.is_sample.is_(True),
                    CodingTestCase.display_order == order,
                )
            )
            if existing.scalar_one_or_none() is None:
                session.add(
                    CodingTestCase(
                        problem_id=problem.id,
                        input_data=inp,
                        expected_output=out,
                        is_sample=True,
                        display_order=order,
                    )
                )

        for order, (inp, out) in enumerate(spec["hidden"]):
            existing = await session.execute(
                select(CodingTestCase).where(
                    CodingTestCase.problem_id == problem.id,
                    CodingTestCase.is_sample.is_(False),
                    CodingTestCase.display_order == order,
                )
            )
            if existing.scalar_one_or_none() is None:
                session.add(
                    CodingTestCase(
                        problem_id=problem.id,
                        input_data=inp,
                        expected_output=out,
                        is_sample=False,
                        display_order=100 + order,
                    )
                )
        count += 1

    await session.flush()
    print(f"  coding: {count} problems with sample + hidden test cases")


# ---------------------------------------------------------------------------
# Career path + projects + achievements
# ---------------------------------------------------------------------------

async def seed_career(session, skills: dict):
    career, _ = await get_or_create(
        session,
        CareerPath,
        {"slug": "software-engineering"},
        {
            "title": "Software Engineering",
            "description": "The most common target for CSE graduates: strong DSA, solid CS fundamentals, and a few real projects.",
            "target_role": "Software Engineer / SDE",
            "status": "published",
        },
    )

    for code, importance, order in [
        ("cpp-fundamentals", "required", 1),
        ("complexity-analysis", "required", 2),
        ("arrays-strings", "required", 3),
        ("hashing", "required", 4),
        ("two-pointers-sliding-window", "recommended", 5),
        ("binary-search", "recommended", 6),
        ("trees-graphs", "recommended", 7),
    ]:
        existing = await session.execute(
            select(CareerPathSkill).where(
                CareerPathSkill.career_path_id == career.id,
                CareerPathSkill.skill_id == skills[code].id,
            )
        )
        if existing.scalar_one_or_none() is None:
            session.add(
                CareerPathSkill(
                    career_path_id=career.id,
                    skill_id=skills[code].id,
                    importance=importance,
                    display_order=order,
                )
            )

    projects = [
        ("task-manager-api", "Task Manager API", "beginner", "Build a REST API for tasks: CRUD, filtering, and authentication.", ["Python", "FastAPI", "PostgreSQL"]),
        ("dsa-practice-tracker", "DSA Practice Tracker", "beginner", "Track solved problems, streaks, and weak topics in a small web app.", ["Next.js", "TypeScript"]),
        ("campus-notes-platform", "Campus Notes Platform", "intermediate", "Let students upload and upvote subject notes with moderation.", ["Next.js", "FastAPI", "PostgreSQL"]),
    ]
    for slug, title, difficulty, desc, stack in projects:
        await get_or_create(
            session,
            Project,
            {"slug": slug},
            {
                "title": title,
                "description": desc,
                "difficulty": difficulty,
                "estimated_hours": Decimal("20"),
                "tech_stack": stack,
                "status": "published",
            },
        )

    achievements = [
        ("first-lesson", "First Steps", "Complete your first lesson.", {"type": "lessons_completed", "count": 1}, 50),
        ("first-solve", "First Blood", "Get an accepted solution on any coding problem.", {"type": "problems_accepted", "count": 1}, 100),
        ("week-streak", "Week Warrior", "Learn on 7 different days.", {"type": "learning_days", "count": 7}, 150),
        ("path-finisher", "Path Finisher", "Complete every required node in a learning path.", {"type": "path_completed", "count": 1}, 500),
    ]
    for code, title, desc, criteria, xp in achievements:
        await get_or_create(
            session,
            Achievement,
            {"code": code},
            {"title": title, "description": desc, "criteria": criteria, "xp_reward": xp, "is_active": True},
        )

    print("  career: 1 path (7 skills), 3 projects; 4 achievements")


# A few published resources so the academics screens aren't empty.
async def seed_resources(session, offerings: dict[int, list]):
    # offerings[3] = semester 3 -> Data Structures is first core subject (CS301)
    sem3 = offerings.get(3, [])
    if not sem3:
        return
    dsa_offering = next((o for o in sem3 if o.local_subject_code == "CS301"), sem3[0])
    units = (
        await session.execute(
            select(SyllabusUnit).where(SyllabusUnit.semester_subject_id == dsa_offering.id).order_by(SyllabusUnit.unit_number)
        )
    ).scalars().all()

    samples = [
        ("DSA Unit 1 - Arrays & Complexity notes", "notes", "Reference notes covering arrays, vectors, and Big-O basics.", units[0].id if units else None),
        ("Sorting algorithms comparison chart", "notes", "When to use each sorting algorithm with complexity table.", units[1].id if len(units) > 1 else None),
        ("Arrays practical set 1", "experiment", "Hands-on exercises: reverse, rotate, and find max subarray.", units[0].id if units else None),
        ("Common viva questions - Data Structures", "viva", "Frequently asked oral exam questions with model answers.", None),
    ]
    count = 0
    for title, rtype, summary, unit_id in samples:
        _, created = await get_or_create(
            session,
            AcademicResource,
            {"subject_offering_id": dsa_offering.id, "title": title, "resource_type": rtype},
            {
                "unit_id": unit_id,
                "summary": summary,
                "content_markdown": f"# {title}\n\n{summary}\n\n*Seed content - expand before production.*",
                "verification_status": "verified",
                "publication_status": "published",
                "published_at": datetime.now(timezone.utc),
            },
        )
        count += created
    print(f"  resources: {count} sample published resources for Data Structures")


async def main():
    async with SessionLocal() as session:
        print("Seeding Student Growth Platform...")
        admin = await seed_identity(session)
        academics = await seed_curriculum(session, admin)
        learning = await seed_learning(session, admin)
        await seed_coding(session, learning["skills"])
        await seed_career(session, learning["skills"])
        await seed_resources(session, academics["offerings"])
        await session.commit()
        print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
