export type CodingDifficulty = 'Easy' | 'Medium' | 'Hard';

export type PublicExample = {
  input: string;
  output: string;
  explanation: string;
};

export type CodingProblem = {
  id: string;
  title: string;
  difficulty: CodingDifficulty;
  topic: string;
  tags: string[];
  summary: string;
  statement: string[];
  constraints: string[];
  inputFormat: string[];
  outputFormat: string[];
  examples: PublicExample[];
  starterCode: string;
  expectedComplexity: string;
  xp: number;
  relatedLessonId: string;
  relatedLessonTitle: string;
};

export const codingProblems: CodingProblem[] = [
  {
    id: 'two-sum', title: 'Two Sum', difficulty: 'Easy', topic: 'Arrays & Hashing', tags: ['Array', 'Hash Map'],
    summary: 'Find the indices of two values whose sum equals the target.',
    statement: [
      'Given an array of integers and an integer target, return the indices of the two distinct elements whose values add up to target.',
      'You may assume that exactly one valid pair exists. Return the smaller index first. You must not use the same element twice.',
    ],
    constraints: ['2 ≤ n ≤ 100,000', '-1,000,000,000 ≤ nums[i], target ≤ 1,000,000,000', 'Exactly one valid answer exists.'],
    inputFormat: ['The first line contains n.', 'The second line contains n space-separated integers.', 'The third line contains target.'],
    outputFormat: ['Print the two zero-based indices in ascending order, separated by one space.'],
    examples: [
      { input: '4\n2 7 11 15\n9\n', output: '0 1', explanation: 'nums[0] + nums[1] = 2 + 7 = 9.' },
      { input: '3\n3 2 4\n6\n', output: '1 2', explanation: 'nums[1] + nums[2] = 2 + 4 = 6.' },
      { input: '3\n3 3 2\n6\n', output: '0 1', explanation: 'The two 3s form the only valid pair.' },
    ],
    starterCode: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    int n;\n    cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; ++i) cin >> nums[i];\n    int target;\n    cin >> target;\n\n    // TODO: Find the pair and print the two indices.\n\n    return 0;\n}\n',
    expectedComplexity: 'O(n) time and O(n) extra space with a hash map.', xp: 120, relatedLessonId: 'arrays-two-sum', relatedLessonTitle: 'Two Sum patterns',
  },
  {
    id: 'max-window-sum', title: 'Maximum Sum Subarray of Size K', difficulty: 'Easy', topic: 'Sliding Window', tags: ['Array', 'Sliding Window'],
    summary: 'Find the largest sum among all contiguous subarrays of exactly k elements.',
    statement: [
      'Given an integer array nums and an integer k, find the maximum sum of any contiguous subarray containing exactly k elements.',
      'The array may contain negative values. A valid window always exists.',
    ],
    constraints: ['1 ≤ k ≤ n ≤ 200,000', '-10,000 ≤ nums[i] ≤ 10,000'],
    inputFormat: ['The first line contains n and k.', 'The second line contains n space-separated integers.'],
    outputFormat: ['Print the maximum sum as a 64-bit integer.'],
    examples: [
      { input: '5 3\n1 2 3 4 5\n', output: '12', explanation: 'The window [3, 4, 5] has the maximum sum, 12.' },
      { input: '6 2\n-5 -2 -3 -4 -1 -6\n', output: '-5', explanation: 'The window [-2, -3] has the best contiguous sum, -5.' },
    ],
    starterCode: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    int n, k;\n    cin >> n >> k;\n    vector<long long> nums(n);\n    for (int i = 0; i < n; ++i) cin >> nums[i];\n\n    // TODO: Maintain a fixed-size sliding window.\n\n    return 0;\n}\n',
    expectedComplexity: 'O(n) time and O(1) extra space beyond the input.', xp: 130, relatedLessonId: 'arrays-sliding-window', relatedLessonTitle: 'Sliding window fundamentals',
  },
  {
    id: 'contains-duplicate', title: 'Contains Duplicate', difficulty: 'Easy', topic: 'Hashing', tags: ['Array', 'Hash Set'],
    summary: 'Determine whether any value appears at least twice in the array.',
    statement: [
      'Given an integer array nums, return true if any value appears at least twice, and false if every element is distinct.',
      'Print the lowercase word true or false.',
    ],
    constraints: ['1 ≤ n ≤ 200,000', '-1,000,000,000 ≤ nums[i] ≤ 1,000,000,000'],
    inputFormat: ['The first line contains n.', 'The second line contains n space-separated integers.'],
    outputFormat: ['Print true if a duplicate exists; otherwise print false.'],
    examples: [
      { input: '4\n1 2 3 1\n', output: 'true', explanation: 'The value 1 occurs twice.' },
      { input: '4\n1 2 3 4\n', output: 'false', explanation: 'All four values are distinct.' },
    ],
    starterCode: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    int n;\n    cin >> n;\n    unordered_set<int> seen;\n    bool hasDuplicate = false;\n\n    for (int i = 0; i < n; ++i) {\n        int value;\n        cin >> value;\n        // TODO: Check whether value is already in seen.\n        seen.insert(value);\n    }\n\n    cout << (hasDuplicate ? "true" : "false") << "\\n";\n    return 0;\n}\n',
    expectedComplexity: 'O(n) average time and O(n) extra space.', xp: 100, relatedLessonId: 'hash-set-basics', relatedLessonTitle: 'Hash sets & duplicate detection',
  },
  {
    id: 'binary-search-first', title: 'First Occurrence in a Sorted Array', difficulty: 'Medium', topic: 'Binary Search', tags: ['Array', 'Binary Search'],
    summary: 'Return the first index of target in a sorted array, or -1 if it is absent.',
    statement: [
      'Given a non-decreasing array nums and a target value, return the first (smallest) index at which target occurs.',
      'If target does not appear, print -1. The array can contain duplicate values.',
    ],
    constraints: ['0 ≤ n ≤ 200,000', '-1,000,000,000 ≤ nums[i], target ≤ 1,000,000,000', 'nums is sorted in non-decreasing order.'],
    inputFormat: ['The first line contains n and target.', 'The second line contains n sorted integers. If n is zero, the second line may be empty.'],
    outputFormat: ['Print the zero-based first index, or -1.'],
    examples: [
      { input: '7 2\n1 2 2 2 4 5 8\n', output: '1', explanation: 'The first 2 appears at index 1.' },
      { input: '5 7\n1 2 3 4 5\n', output: '-1', explanation: 'The target is not present.' },
    ],
    starterCode: '#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios::sync_with_stdio(false);\n    cin.tie(nullptr);\n\n    int n, target;\n    cin >> n >> target;\n    vector<int> nums(n);\n    for (int i = 0; i < n; ++i) cin >> nums[i];\n\n    // TODO: Use binary search to find the first occurrence.\n\n    return 0;\n}\n',
    expectedComplexity: 'O(log n) time and O(1) extra space.', xp: 140, relatedLessonId: 'binary-search', relatedLessonTitle: 'Binary search & boundaries',
  },
];

export function getCodingProblem(problemId: string) {
  return codingProblems.find((problem) => problem.id === problemId);
}
