export type LessonType = 'lesson' | 'practice' | 'assessment';
export type LessonStatus = 'mastered' | 'in-progress' | 'available';

export type SkillQuestLesson = {
  id: string;
  title: string;
  summary: string;
  duration: number;
  xp: number;
  type: LessonType;
  status: LessonStatus;
  recommendedPrerequisites: string[];
  tags: string[];
  objectives: string[];
  keyTakeaways: string[];
  exampleTitle: string;
  exampleCode: string;
  practicePrompt: string;
};

export type SkillQuestModule = {
  id: string;
  title: string;
  description: string;
  estimatedMinutes: number;
  lessons: SkillQuestLesson[];
};

export type SkillQuestPath = {
  id: string;
  title: string;
  category: string;
  summary: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  estimatedHours: number;
  totalXp: number;
  accent: 'indigo' | 'emerald' | 'amber';
  icon: 'code' | 'database' | 'layers';
  enrolled: boolean;
  featured: boolean;
  skills: string[];
  modules: SkillQuestModule[];
};

const cppPath: SkillQuestPath = {
  id: 'cpp-dsa-foundations',
  title: 'C++ & DSA Foundations',
  category: 'Software Engineering',
  summary: 'Build strong C++ fundamentals, learn to reason about time and space complexity, and solve your first data-structure problems with confidence.',
  level: 'Beginner',
  duration: '8–10 weeks',
  estimatedHours: 36,
  totalXp: 2400,
  accent: 'indigo',
  icon: 'code',
  enrolled: true,
  featured: true,
  skills: ['C++', 'Problem solving', 'Arrays', 'Searching & sorting', 'Hashing'],
  modules: [
    {
      id: 'cpp-core', title: 'C++ Core Essentials', description: 'Get comfortable writing small, correct C++ programs.', estimatedMinutes: 210,
      lessons: [
        { id: 'cpp-variables', title: 'Variables, types & input/output', summary: 'Represent values, read input, and print formatted output.', duration: 25, xp: 60, type: 'lesson', status: 'mastered', recommendedPrerequisites: [], tags: ['C++ basics'], objectives: ['Choose suitable primitive types for common values.', 'Read input with cin and display output with cout.', 'Recognize common compile-time type mistakes.'], keyTakeaways: ['Use int for whole numbers and double for decimal values when appropriate.', 'Initialize variables before reading or using them.', 'Use clear names that describe the value being stored.'], exampleTitle: 'Read two integers and print their sum', exampleCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int a, b;\n    cin >> a >> b;\n    cout << a + b << \'\\n\';\n    return 0;\n}', practicePrompt: 'Read three integers and print their sum and average.' },
        { id: 'cpp-control-flow', title: 'Conditions & loops', summary: 'Use if/else, for, while, and nested loops to control program flow.', duration: 35, xp: 80, type: 'lesson', status: 'mastered', recommendedPrerequisites: ['Variables, types & input/output'], tags: ['Control flow'], objectives: ['Choose between if/else, switch, and loops.', 'Trace loop variables through iterations.', 'Avoid off-by-one errors.'], keyTakeaways: ['A loop should have a clear initialization, condition, and update.', 'Use braces consistently to make control flow explicit.', 'Trace small examples before optimizing.'], exampleTitle: 'Count from 1 to n', exampleCode: '#include <iostream>\nusing namespace std;\n\nint main() {\n    int n;\n    cin >> n;\n    for (int i = 1; i <= n; ++i) {\n        cout << i << \' \' ;\n    }\n}', practicePrompt: 'Print all even numbers from 1 through n, then calculate their sum.' },
        { id: 'cpp-functions', title: 'Functions & modular thinking', summary: 'Break a problem into small functions with clear inputs and outputs.', duration: 40, xp: 90, type: 'lesson', status: 'mastered', recommendedPrerequisites: ['Conditions & loops'], tags: ['Functions'], objectives: ['Define and call functions.', 'Pass values and return results.', 'Separate problem logic into reusable steps.'], keyTakeaways: ['A function should have one clear responsibility.', 'Prefer meaningful parameter and function names.', 'Return a result when the caller needs to use it.'], exampleTitle: 'Check whether a number is even', exampleCode: 'bool isEven(int number) {\n    return number % 2 == 0;\n}', practicePrompt: 'Write a function that returns the largest of three integers.' },
        { id: 'cpp-vectors', title: 'References, arrays & vectors', summary: 'Work with contiguous collections and pass larger values efficiently.', duration: 45, xp: 100, type: 'practice', status: 'in-progress', recommendedPrerequisites: ['Functions & modular thinking'], tags: ['Arrays', 'STL'], objectives: ['Declare and traverse arrays and vectors.', 'Understand zero-based indexing.', 'Pass vectors by reference when mutation is intended.'], keyTakeaways: ['A vector stores elements in contiguous order and can grow dynamically.', 'Valid indices range from zero to size minus one.', 'Check boundaries before accessing an element.'], exampleTitle: 'Find the largest value in a vector', exampleCode: 'int largest = nums[0];\nfor (int value : nums) {\n    largest = max(largest, value);\n}', practicePrompt: 'Read n numbers into a vector and print the minimum and maximum values.' },
      ],
    },
    {
      id: 'problem-solving', title: 'Problem Solving & Complexity', description: 'Learn to reason about solution efficiency before choosing an approach.', estimatedMinutes: 240,
      lessons: [
        { id: 'dsa-big-o', title: 'Time & space complexity', summary: 'Estimate how runtime and memory grow as input size increases.', duration: 30, xp: 90, type: 'lesson', status: 'mastered', recommendedPrerequisites: ['Conditions & loops'], tags: ['Big-O'], objectives: ['Explain input size and growth rate.', 'Recognize O(1), O(n), O(n log n), and O(n²).', 'Distinguish auxiliary space from total input storage.'], keyTakeaways: ['Big-O describes growth, not an exact runtime.', 'Nested loops often multiply their iteration counts.', 'Ignore constant factors when describing asymptotic growth.'], exampleTitle: 'Compare one loop and nested loops', exampleCode: '// O(n)\nfor (int i = 0; i < n; ++i) { /* work */ }\n\n// O(n^2)\nfor (int i = 0; i < n; ++i) {\n    for (int j = 0; j < n; ++j) { /* work */ }\n}', practicePrompt: 'Classify the time complexity of a loop that halves n on every iteration.' },
        { id: 'dsa-approach', title: 'A repeatable problem-solving approach', summary: 'Translate a prompt into examples, constraints, and a step-by-step plan.', duration: 35, xp: 85, type: 'lesson', status: 'mastered', recommendedPrerequisites: ['Time & space complexity'], tags: ['Problem solving'], objectives: ['Identify inputs, outputs, and constraints.', 'Create edge cases before coding.', 'Explain an approach before implementation.'], keyTakeaways: ['Restate the problem in your own words.', 'Test empty, smallest, and duplicate-value cases.', 'Prefer a correct baseline before optimizing.'], exampleTitle: 'A simple problem-solving checklist', exampleCode: '1. Understand the input and output\n2. Work through a small example\n3. List edge cases\n4. Choose an approach\n5. Analyze complexity\n6. Implement and test', practicePrompt: 'Take a simple maximum-in-array problem and write down its edge cases before coding.' },
        { id: 'dsa-brute-force', title: 'Brute force to better solutions', summary: 'Use a straightforward solution as a baseline, then identify bottlenecks.', duration: 45, xp: 100, type: 'practice', status: 'in-progress', recommendedPrerequisites: ['A repeatable problem-solving approach'], tags: ['Optimization'], objectives: ['Write a clear brute-force solution.', 'Identify repeated work.', 'Use constraints to decide when optimization is needed.'], keyTakeaways: ['Brute force is a useful correctness baseline.', 'Look for repeated scans or repeated calculations.', 'Optimization should preserve the original problem requirements.'], exampleTitle: 'Repeated pair comparison', exampleCode: 'for (int i = 0; i < n; ++i) {\n    for (int j = i + 1; j < n; ++j) {\n        // inspect each pair once\n    }\n}', practicePrompt: 'For a pair-sum problem, describe the brute-force approach and explain its O(n²) cost.' },
        { id: 'dsa-complexity-check', title: 'Complexity checkpoint', summary: 'Check your ability to analyze loops, memory, and common patterns.', duration: 20, xp: 120, type: 'assessment', status: 'available', recommendedPrerequisites: ['Time & space complexity', 'Brute force to better solutions'], tags: ['Checkpoint'], objectives: ['Analyze short code snippets.', 'Choose a suitable complexity class.', 'Explain the reasoning behind each answer.'], keyTakeaways: ['Analyze how many times the core operation runs.', 'Consider nested and sequential loops separately.', 'State assumptions about input size.'], exampleTitle: 'Checkpoint preview', exampleCode: 'for (int i = 1; i < n; i *= 2) {\n    cout << i << \'\\n\';\n}', practicePrompt: 'Explain why the loop above runs in logarithmic time.' },
      ],
    },
    {
      id: 'arrays-strings', title: 'Arrays & Strings', description: 'Build the patterns used in a large number of beginner and intermediate coding questions.', estimatedMinutes: 300,
      lessons: [
        { id: 'arrays-traversal', title: 'Array traversal & indexing', summary: 'Scan a collection safely and build common aggregate results.', duration: 30, xp: 80, type: 'lesson', status: 'mastered', recommendedPrerequisites: ['References, arrays & vectors'], tags: ['Arrays'], objectives: ['Traverse an array using indices and range-based loops.', 'Track minimum, maximum, and running totals.', 'Avoid invalid index access.'], keyTakeaways: ['Arrays use zero-based indexing.', 'A single traversal is usually O(n).', 'Initialize aggregates from actual input values when possible.'], exampleTitle: 'Calculate the sum of an array', exampleCode: 'long long sum = 0;\nfor (int value : nums) {\n    sum += value;\n}', practicePrompt: 'Find the second-largest distinct value in an integer array.' },
        { id: 'arrays-prefix-sum', title: 'Prefix sums', summary: 'Answer range-sum queries efficiently after a linear preprocessing pass.', duration: 35, xp: 100, type: 'lesson', status: 'in-progress', recommendedPrerequisites: ['Array traversal & indexing'], tags: ['Arrays', 'Patterns'], objectives: ['Construct a prefix-sum array.', 'Answer inclusive range-sum queries.', 'Use a leading zero to simplify boundaries.'], keyTakeaways: ['prefix[i + 1] stores the sum of the first i + 1 values.', 'A range sum can be computed with two prefix values.', 'Use long long if sums may exceed int range.'], exampleTitle: 'Range sum from left to right', exampleCode: 'vector<long long> prefix(n + 1, 0);\nfor (int i = 0; i < n; ++i) {\n    prefix[i + 1] = prefix[i] + nums[i];\n}\nlong long rangeSum = prefix[r + 1] - prefix[l];', practicePrompt: 'Build a prefix array and answer three range-sum queries.' },
        { id: 'arrays-two-sum', title: 'Two Sum patterns', summary: 'Compare nested-loop search with sorting and hash-based lookup.', duration: 40, xp: 120, type: 'practice', status: 'available', recommendedPrerequisites: ['Array traversal & indexing', 'Hash map fundamentals (recommended)'], tags: ['Arrays', 'Hashing'], objectives: ['State the brute-force pair search.', 'Use a complement to reason about lookup.', 'Compare time and space trade-offs.'], keyTakeaways: ['For each value x, the required complement is target - x.', 'A hash map can provide average constant-time lookup.', 'Do not reuse the same array index unless the problem permits it.'], exampleTitle: 'Complement lookup idea', exampleCode: 'unordered_map<int, int> seen;\nfor (int i = 0; i < n; ++i) {\n    int need = target - nums[i];\n    if (seen.count(need)) { /* answer found */ }\n    seen[nums[i]] = i;\n}', practicePrompt: 'Solve Two Sum first with two loops, then explain how a hash map changes the complexity.' },
        { id: 'arrays-sliding-window', title: 'Sliding window fundamentals', summary: 'Maintain a moving range instead of recalculating every subarray from scratch.', duration: 45, xp: 130, type: 'practice', status: 'available', recommendedPrerequisites: ['Array traversal & indexing', 'Prefix sums (recommended)'], tags: ['Arrays', 'Two pointers'], objectives: ['Recognize fixed-size window problems.', 'Update a window sum in constant time.', 'Track the best window while scanning.'], keyTakeaways: ['Add the entering element and remove the leaving element.', 'A fixed-size window can often be solved in O(n).', 'Variable-size windows need a clear condition for shrinking.'], exampleTitle: 'Fixed-size window update', exampleCode: 'int windowSum = 0;\nfor (int i = 0; i < k; ++i) windowSum += nums[i];\nint best = windowSum;\nfor (int i = k; i < n; ++i) {\n    windowSum += nums[i] - nums[i - k];\n    best = max(best, windowSum);\n}', practicePrompt: 'Find the maximum sum of any subarray of length k.' },
      ],
    },
    {
      id: 'search-sorting', title: 'Searching & Sorting', description: 'Learn to select and apply fundamental ordering and search techniques.', estimatedMinutes: 270,
      lessons: [
        { id: 'search-linear', title: 'Linear search', summary: 'Search unsorted data and reason about best and worst cases.', duration: 20, xp: 60, type: 'lesson', status: 'available', recommendedPrerequisites: ['Array traversal & indexing'], tags: ['Searching'], objectives: ['Implement a linear scan.', 'Return an index or a not-found result.', 'Explain O(n) worst-case time.'], keyTakeaways: ['Linear search works on unsorted data.', 'The first match may be enough depending on the prompt.', 'Worst-case search inspects every element.'], exampleTitle: 'Find the first matching value', exampleCode: 'int index = -1;\nfor (int i = 0; i < n; ++i) {\n    if (nums[i] == target) { index = i; break; }\n}', practicePrompt: 'Return the first index of target, or -1 if it does not exist.' },
        { id: 'sort-basics', title: 'Sorting with the STL', summary: 'Use std::sort and understand comparator-based ordering.', duration: 30, xp: 80, type: 'lesson', status: 'available', recommendedPrerequisites: ['Array traversal & indexing'], tags: ['Sorting', 'STL'], objectives: ['Sort a vector in ascending order.', 'Use reverse iterators or greater<int> for descending order.', 'Recognize when sorting changes index relationships.'], keyTakeaways: ['std::sort uses an efficient comparison sort.', 'A comparator must define a consistent ordering.', 'Sorting typically costs O(n log n).'], exampleTitle: 'Sort a vector', exampleCode: 'sort(nums.begin(), nums.end());\nsort(nums.begin(), nums.end(), greater<int>());', practicePrompt: 'Sort pairs by their second value using a custom comparator.' },
        { id: 'binary-search', title: 'Binary search & boundaries', summary: 'Search sorted data by repeatedly eliminating half the search space.', duration: 45, xp: 120, type: 'lesson', status: 'available', recommendedPrerequisites: ['Linear search', 'Sorting with the STL'], tags: ['Searching', 'Binary search'], objectives: ['Maintain a valid search interval.', 'Implement lower_bound-style boundary search.', 'Avoid infinite loops and off-by-one errors.'], keyTakeaways: ['Binary search requires a monotonic condition or sorted data.', 'Choose inclusive or half-open boundaries and keep them consistent.', 'The number of steps grows logarithmically.'], exampleTitle: 'Lower-bound style binary search', exampleCode: 'int low = 0, high = n;\nwhile (low < high) {\n    int mid = low + (high - low) / 2;\n    if (nums[mid] < target) low = mid + 1;\n    else high = mid;\n}', practicePrompt: 'Find the first position where a sorted vector contains a value greater than or equal to target.' },
        { id: 'search-sort-challenge', title: 'Searching & sorting challenge', summary: 'Apply sorting and binary search to a timed coding exercise.', duration: 35, xp: 150, type: 'practice', status: 'available', recommendedPrerequisites: ['Binary search & boundaries'], tags: ['Coding challenge'], objectives: ['Select a suitable search strategy.', 'Handle duplicates and missing targets.', 'Explain time complexity.'], keyTakeaways: ['Test empty, single-element, and duplicate-heavy arrays.', 'Do not use binary search on unsorted data without a valid transformation.', 'State the complexity of sorting plus searching together.'], exampleTitle: 'Challenge preview', exampleCode: 'Given a sorted array and a target, return the first index of the target.', practicePrompt: 'Implement the first-occurrence search and test it with duplicates.' },
      ],
    },
    {
      id: 'hashing', title: 'Hashing & Two Pointers', description: 'Use hash tables and pointer movement to reduce repeated work.', estimatedMinutes: 300,
      lessons: [
        { id: 'hash-map-basics', title: 'Hash map fundamentals', summary: 'Store key-value pairs for fast average lookup.', duration: 35, xp: 100, type: 'lesson', status: 'available', recommendedPrerequisites: ['Two Sum patterns (recommended)'], tags: ['Hashing', 'STL'], objectives: ['Declare and update an unordered_map.', 'Check whether a key exists.', 'Describe average and worst-case lookup behavior.'], keyTakeaways: ['unordered_map stores key-value pairs.', 'Use find or count to check for a key.', 'Average lookup is O(1), while worst-case behavior can be O(n).'], exampleTitle: 'Count frequencies', exampleCode: 'unordered_map<int, int> frequency;\nfor (int value : nums) {\n    frequency[value]++;\n}', practicePrompt: 'Count how many times each number appears in an array.' },
        { id: 'hash-set-basics', title: 'Hash sets & duplicate detection', summary: 'Track values that have already appeared without storing extra mapped data.', duration: 30, xp: 90, type: 'practice', status: 'available', recommendedPrerequisites: ['Hash map fundamentals'], tags: ['Hashing', 'STL'], objectives: ['Use unordered_set for membership checks.', 'Detect duplicates in one pass.', 'Explain the space-time trade-off.'], keyTakeaways: ['A set stores unique keys.', 'Membership checks are average O(1).', 'A set uses additional memory proportional to distinct values.'], exampleTitle: 'Detect a duplicate', exampleCode: 'unordered_set<int> seen;\nfor (int value : nums) {\n    if (seen.count(value)) return true;\n    seen.insert(value);\n}\nreturn false;', practicePrompt: 'Solve the Contains Duplicate problem and explain the average complexity.' },
        { id: 'two-pointers', title: 'Two pointers', summary: 'Use two indices to scan from opposite ends or maintain a moving pair.', duration: 40, xp: 120, type: 'lesson', status: 'available', recommendedPrerequisites: ['Sorting with the STL (recommended)'], tags: ['Two pointers'], objectives: ['Recognize sorted-array pair problems.', 'Move pointers based on a comparison.', 'Explain why a pointer can be discarded.'], keyTakeaways: ['The sorted order allows directional decisions.', 'Each pointer often moves at most n times.', 'Two pointers can reduce nested loops to linear scans.'], exampleTitle: 'Pair sum in a sorted array', exampleCode: 'int left = 0, right = n - 1;\nwhile (left < right) {\n    int sum = nums[left] + nums[right];\n    if (sum == target) break;\n    if (sum < target) ++left;\n    else --right;\n}', practicePrompt: 'Determine whether a sorted array contains two values whose sum equals target.' },
        { id: 'hashing-checkpoint', title: 'Hashing & pointers checkpoint', summary: 'Choose between maps, sets, sorting, and pointer-based approaches.', duration: 25, xp: 140, type: 'assessment', status: 'available', recommendedPrerequisites: ['Hash map fundamentals', 'Two pointers'], tags: ['Checkpoint'], objectives: ['Select a suitable pattern.', 'Analyze time and space complexity.', 'Identify important edge cases.'], keyTakeaways: ['Choose a data structure based on the operation you need.', 'Sorting can enable two-pointer strategies.', 'Validate the approach against duplicates and negative values.'], exampleTitle: 'Checkpoint preview', exampleCode: 'Which approach would you choose for fast duplicate detection in an unsorted array?', practicePrompt: 'Compare an unordered_set approach with sorting followed by adjacent comparisons.' },
      ],
    },
  ],
};

const sqlPath: SkillQuestPath = {
  id: 'sql-database-foundations', title: 'SQL & Database Foundations', category: 'Data & Backend', summary: 'Learn relational database concepts, write practical SQL queries, and understand how application data is modeled and protected.', level: 'Beginner', duration: '4–5 weeks', estimatedHours: 18, totalXp: 1200, accent: 'emerald', icon: 'database', enrolled: true, featured: false, skills: ['Relational model', 'SQL', 'Joins', 'Normalization', 'Transactions'],
  modules: [
    { id: 'sql-model', title: 'Relational foundations', description: 'Understand tables, keys, and relationships.', estimatedMinutes: 150, lessons: [
      { id: 'sql-tables', title: 'Tables, rows & data types', summary: 'Model structured information using relational tables.', duration: 25, xp: 60, type: 'lesson', status: 'mastered', recommendedPrerequisites: [], tags: ['Relational model'], objectives: ['Describe rows, columns, and domains.', 'Choose suitable SQL data types.', 'Recognize primary-key requirements.'], keyTakeaways: ['A relation represents a set of tuples.', 'Each column has a defined domain.', 'A primary key identifies a row uniquely.'], exampleTitle: 'Create a simple table', exampleCode: 'CREATE TABLE students (\n  id BIGINT PRIMARY KEY,\n  full_name VARCHAR(120) NOT NULL,\n  semester SMALLINT\n);', practicePrompt: 'Design a courses table with a unique course code and a course title.' },
      { id: 'sql-keys', title: 'Primary & foreign keys', summary: 'Connect related records while keeping references valid.', duration: 30, xp: 80, type: 'lesson', status: 'in-progress', recommendedPrerequisites: ['Tables, rows & data types'], tags: ['Keys'], objectives: ['Explain primary and foreign keys.', 'Model one-to-many relationships.', 'Recognize referential integrity.'], keyTakeaways: ['A foreign key references a candidate key in another table.', 'Foreign keys help prevent orphaned references.', 'Choose delete behavior intentionally.'], exampleTitle: 'Add a foreign key', exampleCode: 'CREATE TABLE enrollments (\n  student_id BIGINT REFERENCES students(id),\n  course_id BIGINT REFERENCES courses(id),\n  PRIMARY KEY (student_id, course_id)\n);', practicePrompt: 'Model students and course enrollments with a composite primary key.' },
      { id: 'sql-relationships', title: 'Relationships & ER modeling', summary: 'Translate entities and cardinalities into relational schemas.', duration: 35, xp: 90, type: 'practice', status: 'available', recommendedPrerequisites: ['Primary & foreign keys'], tags: ['ER modeling'], objectives: ['Identify entities and attributes.', 'Read cardinality and participation.', 'Convert a simple ER design to tables.'], keyTakeaways: ['One-to-many relationships usually place the foreign key on the many side.', 'Many-to-many relationships usually need a junction table.', 'Normalize repeated facts into appropriate relations.'], exampleTitle: 'A many-to-many relation', exampleCode: 'students ──< enrollments >── courses', practicePrompt: 'Sketch tables for students, courses, and course enrollments.' },
    ]},
    { id: 'sql-queries', title: 'SQL Querying', description: 'Retrieve, filter, aggregate, and combine data.', estimatedMinutes: 210, lessons: [
      { id: 'sql-select', title: 'SELECT, WHERE & ORDER BY', summary: 'Retrieve rows and apply filters and ordering.', duration: 30, xp: 80, type: 'lesson', status: 'available', recommendedPrerequisites: ['Tables, rows & data types'], tags: ['SQL'], objectives: ['Select specific columns.', 'Filter with WHERE.', 'Sort results deterministically.'], keyTakeaways: ['Use explicit column lists instead of SELECT * in production code.', 'Use parameterized queries from application code.', 'ORDER BY is required when result order matters.'], exampleTitle: 'Filter and sort records', exampleCode: 'SELECT id, full_name\nFROM students\nWHERE semester >= 4\nORDER BY full_name ASC;', practicePrompt: 'Find all students in semester 5 and order them by name.' },
      { id: 'sql-joins', title: 'INNER JOIN & LEFT JOIN', summary: 'Combine related records while understanding unmatched rows.', duration: 40, xp: 100, type: 'lesson', status: 'available', recommendedPrerequisites: ['Primary & foreign keys'], tags: ['Joins'], objectives: ['Join tables on matching keys.', 'Distinguish INNER and LEFT joins.', 'Avoid accidental row multiplication.'], keyTakeaways: ['INNER JOIN keeps matching pairs.', 'LEFT JOIN retains every row from the left side.', 'Join conditions should use the intended relationship keys.'], exampleTitle: 'Join students to enrollments', exampleCode: 'SELECT s.full_name, e.course_id\nFROM students AS s\nLEFT JOIN enrollments AS e\n  ON e.student_id = s.id;', practicePrompt: 'List every student with their enrolled course IDs, including students with no enrollments.' },
    ]},
    { id: 'sql-design', title: 'Database Design & Reliability', description: 'Improve schema quality and preserve consistent data.', estimatedMinutes: 180, lessons: [
      { id: 'sql-normalization', title: 'Normalization basics', summary: 'Reduce update anomalies with well-structured relations.', duration: 40, xp: 110, type: 'lesson', status: 'available', recommendedPrerequisites: ['Relationships & ER modeling'], tags: ['Normalization'], objectives: ['Explain 1NF, 2NF, and 3NF at a practical level.', 'Identify repeating groups and partial dependencies.', 'Split relations while preserving useful joins.'], keyTakeaways: ['Normalization reduces redundant facts.', 'Functional dependencies guide decomposition.', 'Denormalization should be an intentional trade-off.'], exampleTitle: 'Separate course information', exampleCode: 'students(student_id, name)\ncourses(course_id, title)\nenrollments(student_id, course_id, grade)', practicePrompt: 'Normalize a table that repeats course title and instructor for every enrolled student.' },
      { id: 'sql-transactions', title: 'Transactions & ACID', summary: 'Understand atomicity, consistency, isolation, and durability.', duration: 35, xp: 110, type: 'lesson', status: 'available', recommendedPrerequisites: ['Primary & foreign keys'], tags: ['Transactions'], objectives: ['Describe the ACID properties.', 'Use BEGIN, COMMIT, and ROLLBACK.', 'Explain why transactions matter for multi-step updates.'], keyTakeaways: ['A transaction groups operations into one unit.', 'Rollback prevents partial completion after failure.', 'Isolation controls how concurrent transactions interact.'], exampleTitle: 'Transfer funds atomically', exampleCode: 'BEGIN;\nUPDATE accounts SET balance = balance - 500 WHERE id = 1;\nUPDATE accounts SET balance = balance + 500 WHERE id = 2;\nCOMMIT;', practicePrompt: 'Explain what should happen if the second update fails during a transfer.' },
    ]},
  ],
};

const projectPath: SkillQuestPath = {
  id: 'full-stack-project-builder', title: 'Full-Stack Project Builder', category: 'Career Readiness', summary: 'Turn frontend, backend, database, testing, and deployment knowledge into a portfolio-ready application.', level: 'Intermediate', duration: '10–12 weeks', estimatedHours: 48, totalXp: 3200, accent: 'amber', icon: 'layers', enrolled: false, featured: false, skills: ['React & Next.js', 'API design', 'PostgreSQL', 'Testing', 'Deployment'],
  modules: [
    { id: 'project-plan', title: 'Plan a maintainable application', description: 'Define users, workflows, and a small first release.', estimatedMinutes: 180, lessons: [
      { id: 'project-scope', title: 'Scope & user stories', summary: 'Translate a product idea into testable user stories.', duration: 35, xp: 90, type: 'lesson', status: 'available', recommendedPrerequisites: [], tags: ['Planning'], objectives: ['Identify primary user journeys.', 'Write concise acceptance criteria.', 'Separate MVP scope from later ideas.'], keyTakeaways: ['Start from user outcomes, not framework choices.', 'Keep the first iteration small enough to validate.', 'Acceptance criteria make behavior testable.'], exampleTitle: 'Example user story', exampleCode: 'As a student, I want to save a learning resource so I can revisit it later.', practicePrompt: 'Write three user stories for a student learning dashboard.' },
      { id: 'project-architecture', title: 'Frontend & backend boundaries', summary: 'Separate UI concerns, API contracts, and data ownership.', duration: 40, xp: 100, type: 'lesson', status: 'available', recommendedPrerequisites: ['Scope & user stories'], tags: ['Architecture'], objectives: ['Define frontend and backend responsibilities.', 'Sketch an API boundary.', 'Identify shared domain entities.'], keyTakeaways: ['The frontend should not own security decisions.', 'The API is a contract between clients and services.', 'Start with a modular monolith before splitting services.'], exampleTitle: 'Simple application boundary', exampleCode: 'Next.js UI → FastAPI → PostgreSQL', practicePrompt: 'Draw a small architecture for a notes application.' },
    ]},
    { id: 'project-build', title: 'Build, test & ship', description: 'Implement an application workflow and prepare it for users.', estimatedMinutes: 300, lessons: [
      { id: 'project-api', title: 'Build a resource API', summary: 'Implement validated create, read, update, and delete operations.', duration: 50, xp: 130, type: 'practice', status: 'available', recommendedPrerequisites: ['Frontend & backend boundaries'], tags: ['API'], objectives: ['Design REST endpoints.', 'Validate request and response schemas.', 'Return useful errors and status codes.'], keyTakeaways: ['Validate at the API boundary.', 'Use consistent error formats.', 'Keep database access behind service or repository boundaries.'], exampleTitle: 'Endpoint sketch', exampleCode: 'GET    /api/v1/resources\nPOST   /api/v1/resources\nGET    /api/v1/resources/{id}\nPATCH  /api/v1/resources/{id}\nDELETE /api/v1/resources/{id}', practicePrompt: 'Define request and response shapes for creating a bookmark.' },
      { id: 'project-testing', title: 'Testing & deployment checklist', summary: 'Add tests, environment configuration, and a reliable deployment flow.', duration: 45, xp: 140, type: 'assessment', status: 'available', recommendedPrerequisites: ['Build a resource API'], tags: ['Testing', 'Deployment'], objectives: ['Test important success and failure cases.', 'Separate secrets from source code.', 'Describe a basic CI pipeline.'], keyTakeaways: ['Test behavior at the right level.', 'Keep environment-specific values out of committed code.', 'A release checklist reduces avoidable deployment errors.'], exampleTitle: 'Minimum CI sequence', exampleCode: '1. Install dependencies\n2. Run lint and type checks\n3. Run tests\n4. Build the application\n5. Publish the artifact', practicePrompt: 'Create a release checklist for a small Next.js and FastAPI project.' },
    ]},
  ],
};

export const skillQuestPaths: SkillQuestPath[] = [cppPath, sqlPath, projectPath];

export function getSkillQuestPath(pathId: string) {
  return skillQuestPaths.find((path) => path.id === pathId);
}

export function getSkillQuestLesson(lessonId: string) {
  for (const path of skillQuestPaths) {
    for (const pathModule of path.modules) {
      const lesson = pathModule.lessons.find((item) => item.id === lessonId);
      if (lesson) return { lesson, path, module: pathModule };
    }
  }
  return undefined;
}

export function getAllLessons() {
  return skillQuestPaths.flatMap((path) => path.modules.flatMap((module) => module.lessons));
}

export function getSeedCompletedLessonIds() {
  return getAllLessons().filter((lesson) => lesson.status === 'mastered').map((lesson) => lesson.id);
}
