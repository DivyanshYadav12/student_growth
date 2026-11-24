export type ResourceType = 'Notes' | 'Video' | 'Quiz' | 'Reference' | 'Practical' | 'Viva';

export type SubjectResource = {
  id: string;
  title: string;
  type: ResourceType;
  duration?: string;
  description: string;
};

export type SubjectUnit = {
  id: string;
  number: number;
  title: string;
  description: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'locked';
  estimatedTime: string;
  topics: string[];
  resources: SubjectResource[];
};

export type Subject = {
  id: string;
  code: string;
  name: string;
  semester: number;
  credits: number;
  category: string;
  description: string;
  progress: number;
  completedUnits: number;
  totalUnits: number;
  nextUnit: string;
  accent: 'indigo' | 'emerald' | 'amber' | 'sky' | 'violet' | 'rose';
  units: SubjectUnit[];
};

export const subjects: Subject[] = [
  {
    id: 'dbms', code: 'CS401', name: 'Database Management Systems', semester: 4, credits: 4,
    category: 'Core Computer Science', description: 'Understand how data is modelled, stored, queried, secured, and managed in modern database systems.',
    progress: 42, completedUnits: 1, totalUnits: 5, nextUnit: 'Relational Model and SQL', accent: 'emerald',
    units: [
      {
        id: 'dbms-u1', number: 1, title: 'Introduction to Database Systems', description: 'Database concepts, architecture, data models, and the role of a DBMS.', progress: 100, status: 'completed', estimatedTime: '3h 20m',
        topics: ['File systems vs DBMS', 'Three-schema architecture', 'Data independence', 'Database users and languages'],
        resources: [
          { id: 'dbms-r1', title: 'Introduction to DBMS — study notes', type: 'Notes', duration: '12 pages', description: 'Concise notes covering database fundamentals and architecture.' },
          { id: 'dbms-r2', title: 'DBMS architecture explained', type: 'Video', duration: '18 min', description: 'A visual walkthrough of the three-schema architecture.' },
          { id: 'dbms-r3', title: 'Database fundamentals checkpoint', type: 'Quiz', duration: '10 questions', description: 'Test your understanding of the core concepts.' },
        ],
      },
      {
        id: 'dbms-u2', number: 2, title: 'Relational Model and SQL', description: 'Represent data with relations and retrieve it using SQL queries.', progress: 55, status: 'in-progress', estimatedTime: '5h 10m',
        topics: ['Relational model and constraints', 'Keys and integrity rules', 'DDL and DML', 'Joins, grouping, and subqueries'],
        resources: [
          { id: 'dbms-r4', title: 'Relational model and keys', type: 'Notes', duration: '16 pages', description: 'Relations, candidate keys, primary keys, and foreign keys.' },
          { id: 'dbms-r5', title: 'SQL query patterns', type: 'Reference', duration: 'Quick reference', description: 'Common SELECT, JOIN, GROUP BY, and subquery patterns.' },
          { id: 'dbms-r6', title: 'SQL practice set', type: 'Practical', duration: '8 exercises', description: 'Write and run queries against a small student database.' },
          { id: 'dbms-r7', title: 'Relational model viva questions', type: 'Viva', duration: '12 questions', description: 'Practice explaining keys, constraints, and joins aloud.' },
        ],
      },
      {
        id: 'dbms-u3', number: 3, title: 'Relational Algebra and Calculus', description: 'Learn the formal foundations behind relational query processing.', progress: 0, status: 'locked', estimatedTime: '4h 00m',
        topics: ['Selection and projection', 'Set operations', 'Joins and division', 'Tuple and domain relational calculus'],
        resources: [
          { id: 'dbms-r8', title: 'Relational algebra operators', type: 'Notes', duration: '14 pages', description: 'Operator definitions with worked examples.' },
          { id: 'dbms-r9', title: 'Relational algebra practice quiz', type: 'Quiz', duration: '15 questions', description: 'Translate simple information requests into algebra expressions.' },
        ],
      },
      {
        id: 'dbms-u4', number: 4, title: 'Normalization and Transactions', description: 'Design reliable schemas and understand transaction correctness.', progress: 0, status: 'locked', estimatedTime: '5h 30m',
        topics: ['Functional dependencies', '1NF, 2NF, 3NF, and BCNF', 'ACID properties', 'Serializability and concurrency control'],
        resources: [
          { id: 'dbms-r10', title: 'Normalization worked examples', type: 'Notes', duration: '20 pages', description: 'Step-by-step decomposition examples from 1NF to BCNF.' },
          { id: 'dbms-r11', title: 'Transactions and ACID', type: 'Video', duration: '24 min', description: 'Explore atomicity, consistency, isolation, and durability.' },
        ],
      },
      {
        id: 'dbms-u5', number: 5, title: 'Indexing, Storage, and Recovery', description: 'Explore how database engines organize data and recover after failures.', progress: 0, status: 'locked', estimatedTime: '4h 15m',
        topics: ['File organization', 'B-tree and B+ tree indexes', 'Query processing basics', 'Logging and recovery'],
        resources: [
          { id: 'dbms-r12', title: 'Indexing and query performance', type: 'Notes', duration: '17 pages', description: 'Understand index structures and their trade-offs.' },
          { id: 'dbms-r13', title: 'Storage and recovery assessment', type: 'Quiz', duration: '12 questions', description: 'Check your understanding of indexing and recovery.' },
        ],
      },
    ],
  },
  {
    id: 'operating-systems', code: 'CS402', name: 'Operating Systems', semester: 4, credits: 4,
    category: 'Core Computer Science', description: 'Study processes, threads, CPU scheduling, memory management, file systems, and synchronization.',
    progress: 28, completedUnits: 1, totalUnits: 5, nextUnit: 'Process Management and Threads', accent: 'sky', units: [],
  },
  {
    id: 'computer-networks', code: 'CS501', name: 'Computer Networks', semester: 5, credits: 3,
    category: 'Core Computer Science', description: 'Learn network architectures, protocols, routing, transport, and application-layer systems.',
    progress: 15, completedUnits: 0, totalUnits: 5, nextUnit: 'Network Models', accent: 'violet', units: [],
  },
  {
    id: 'object-oriented-programming', code: 'CS302', name: 'Object-Oriented Programming', semester: 3, credits: 3,
    category: 'Programming', description: 'Apply classes, objects, inheritance, polymorphism, abstraction, and modern C++ design.',
    progress: 76, completedUnits: 4, totalUnits: 5, nextUnit: 'Templates and STL', accent: 'amber', units: [],
  },
  {
    id: 'data-structures', code: 'CS303', name: 'Data Structures', semester: 3, credits: 4,
    category: 'Programming', description: 'Build a strong foundation in arrays, linked lists, stacks, queues, trees, graphs, and hashing.',
    progress: 63, completedUnits: 2, totalUnits: 5, nextUnit: 'Trees and Binary Search Trees', accent: 'indigo', units: [],
  },
  {
    id: 'software-engineering', code: 'CS502', name: 'Software Engineering', semester: 5, credits: 3,
    category: 'Core Computer Science', description: 'Understand the software development lifecycle, requirements, design, testing, and delivery.',
    progress: 0, completedUnits: 0, totalUnits: 5, nextUnit: 'Software Process Models', accent: 'rose', units: [],
  },
];

const supplementalTopics: Record<string, string[][]> = {
  'operating-systems': [
    ['Operating system concepts', 'Kernel and system calls', 'Operating system structures'],
    ['Process states and control blocks', 'Threads and multithreading', 'Inter-process communication'],
    ['CPU scheduling algorithms', 'Scheduling criteria', 'Deadlocks and prevention'],
    ['Critical sections and race conditions', 'Semaphores and mutexes', 'Synchronization problems'],
    ['Memory allocation and paging', 'Virtual memory', 'File systems and disk scheduling'],
  ],
  'computer-networks': [
    ['Network fundamentals', 'OSI and TCP/IP models', 'Transmission media'],
    ['Framing and error detection', 'MAC protocols', 'Ethernet and switching'],
    ['IP addressing and subnetting', 'Routing algorithms', 'IPv4 and IPv6'],
    ['UDP and TCP', 'Flow and congestion control', 'Reliable data transfer'],
    ['DNS and HTTP', 'Email protocols', 'Network security basics'],
  ],
  'object-oriented-programming': [
    ['Classes and objects', 'Constructors and destructors', 'Encapsulation'],
    ['Inheritance and composition', 'Access control', 'Code reuse'],
    ['Function and operator overloading', 'Virtual functions', 'Runtime polymorphism'],
    ['Abstract classes and interfaces', 'Exception handling', 'File handling'],
    ['Templates and generic programming', 'STL containers', 'Iterators and algorithms'],
  ],
  'data-structures': [
    ['Algorithm analysis', 'Time and space complexity', 'Arrays and strings'],
    ['Singly and doubly linked lists', 'Stacks and applications', 'Queues and deques'],
    ['Trees and traversals', 'Binary search trees', 'Heaps and priority queues'],
    ['Graph representations', 'BFS and DFS', 'Shortest path fundamentals'],
    ['Hash tables', 'Collision handling', 'Searching and sorting review'],
  ],
  'software-engineering': [
    ['Software characteristics', 'Software process models', 'Agile fundamentals'],
    ['Requirements engineering', 'Use cases and user stories', 'Requirements validation'],
    ['Design principles', 'UML and architecture', 'Design patterns overview'],
    ['Software testing levels', 'Test design techniques', 'Verification and validation'],
    ['Configuration management', 'Maintenance and evolution', 'Quality assurance'],
  ],
};

function createSupplementalUnits(subject: Subject): SubjectUnit[] {
  const topicsByUnit = supplementalTopics[subject.id] ?? [];
  return topicsByUnit.map((topics, index) => {
    const unitNumber = index + 1;
    const status: SubjectUnit['status'] = unitNumber <= subject.completedUnits ? 'completed' : unitNumber === subject.completedUnits + 1 ? 'in-progress' : 'locked';
    return {
      id: `${subject.id}-u${unitNumber}`,
      number: unitNumber,
      title: topics[0],
      description: `Build your understanding of ${topics.slice(0, 2).join(' and ').toLowerCase()} with guided explanations and practice.`,
      progress: status === 'completed' ? 100 : status === 'in-progress' ? subject.progress : 0,
      status,
      estimatedTime: '3h 30m',
      topics,
      resources: [
        { id: `${subject.id}-u${unitNumber}-notes`, title: `${topics[0]} — study notes`, type: 'Notes', duration: '10 pages', description: `Core concepts and examples for ${topics[0].toLowerCase()}.` },
        { id: `${subject.id}-u${unitNumber}-quiz`, title: `${topics[0]} knowledge check`, type: 'Quiz', duration: '10 questions', description: `Check your understanding of ${topics[0].toLowerCase()}.` },
      ],
    };
  });
}

export function getSubject(subjectId: string) {
  const subject = subjects.find((item) => item.id === subjectId);
  if (!subject) return undefined;
  return subject.units.length ? subject : { ...subject, units: createSupplementalUnits(subject) };
}
