// Seed content library + question bank: Data Structures & Algorithms.
const yt = (q) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;

export const TOPICS = ["Arrays", "Linked Lists", "Stacks & Queues", "Trees", "Graphs", "Dynamic Programming"];

export const content = [
  // ---- Arrays
  { topic: "Arrays", type: "note", difficulty: "easy", title: "Array fundamentals & complexity",
    summary: "Contiguous memory, O(1) index access, O(n) insert/delete because elements shift.",
    body: "Arrays store elements in contiguous memory so arr[i] is O(1). Inserting or deleting in the middle or at the front shifts elements: O(n). Dynamic arrays double capacity, giving amortised O(1) append.",
    tags: ["indexing", "time complexity", "dynamic array"] },
  { topic: "Arrays", type: "video", difficulty: "medium", title: "Two pointers, sliding window and Kadane's algorithm",
    summary: "Patterns for pair sums in sorted arrays, subarray windows and maximum subarray sum.",
    url: yt("two pointers sliding window kadane algorithm"), tags: ["two pointers", "sliding window", "kadane", "maximum subarray"] },
  { topic: "Arrays", type: "practice", difficulty: "medium", title: "Array practice set: binary search & subarrays",
    summary: "Binary search on sorted arrays, pair sum with two pointers, maximum subarray sum.",
    body: "1) Find first index >= x with binary search. 2) Pair with target sum in a sorted array. 3) Maximum sum subarray (Kadane).",
    tags: ["binary search", "sorted array", "practice"] },
  // ---- Linked Lists
  { topic: "Linked Lists", type: "note", difficulty: "easy", title: "Singly vs doubly linked lists",
    summary: "Nodes with next (and prev) pointers; O(1) insert at head, O(n) access by index.",
    body: "A linked list has no random access: reaching the k-th node walks k links. Inserting at the head is O(1). Doubly linked lists keep prev pointers so you can traverse backwards and delete a known node in O(1).",
    tags: ["node", "pointer", "head insertion", "doubly linked"] },
  { topic: "Linked Lists", type: "video", difficulty: "medium", title: "Reversing a linked list & Floyd's cycle detection",
    summary: "Iterative reversal with prev/curr/next pointers and the tortoise-and-hare cycle check.",
    url: yt("reverse linked list floyd cycle detection tortoise hare"), tags: ["reverse", "cycle", "fast slow pointers"] },
  { topic: "Linked Lists", type: "practice", difficulty: "medium", title: "Linked list pointer drills",
    summary: "Reverse a list, find the middle node, detect and remove a cycle, merge two sorted lists.",
    body: "Draw every pointer change on paper before coding. Use a dummy head node to avoid edge cases.",
    tags: ["merge sorted lists", "middle node", "practice"] },
  // ---- Stacks & Queues
  { topic: "Stacks & Queues", type: "note", difficulty: "easy", title: "LIFO stacks and FIFO queues",
    summary: "Stack = last in first out (push/pop); queue = first in first out (enqueue/dequeue).",
    body: "Stacks power function calls, undo, and balanced-parentheses checks. Queues power BFS and scheduling. A queue can be built from two stacks with amortised O(1) operations.",
    tags: ["LIFO", "FIFO", "push", "pop", "balanced parentheses"] },
  { topic: "Stacks & Queues", type: "video", difficulty: "medium", title: "Monotonic stack: next greater element",
    summary: "Keep a stack in sorted order to answer next-greater / previous-smaller queries in O(n).",
    url: yt("monotonic stack next greater element"), tags: ["monotonic stack", "next greater element"] },
  { topic: "Stacks & Queues", type: "practice", difficulty: "medium", title: "Stack & queue practice set",
    summary: "Valid parentheses, queue using two stacks, min-stack, next greater element.",
    body: "Trace the stack contents after every operation; write them in a table.",
    tags: ["valid parentheses", "min stack", "practice"] },
  // ---- Trees
  { topic: "Trees", type: "note", difficulty: "easy", title: "Binary trees & binary search trees",
    summary: "Traversals (pre/in/post/level order), BST property, height and balance.",
    body: "In a BST, left < node < right, so inorder traversal gives sorted order. Search is O(h): O(log n) when balanced, O(n) when the tree degenerates into a chain. A binary tree of height h has at most 2^h - 1 nodes.",
    tags: ["BST", "inorder", "height", "balanced tree"] },
  { topic: "Trees", type: "video", difficulty: "medium", title: "Tree traversals: DFS and level-order BFS",
    summary: "Recursive pre/in/post-order DFS and queue-based level-order traversal.",
    url: yt("binary tree traversals inorder preorder postorder level order"), tags: ["traversal", "recursion", "level order", "queue"] },
  { topic: "Trees", type: "practice", difficulty: "medium", title: "Tree practice set",
    summary: "Height of a tree, validate a BST, lowest common ancestor, level-order traversal.",
    body: "For each problem decide first: is it top-down (pass info to children) or bottom-up (return info to parent)?",
    tags: ["validate BST", "LCA", "practice"] },
  // ---- Graphs
  { topic: "Graphs", type: "note", difficulty: "medium", title: "Graph representations, BFS and DFS",
    summary: "Adjacency list vs matrix, BFS for unweighted shortest path, DFS for connectivity and cycles.",
    body: "An adjacency list uses O(V + E) space. BFS explores level by level with a queue and finds shortest paths in unweighted graphs. DFS uses recursion/stack; cycles in undirected graphs can also be found with Union-Find.",
    tags: ["adjacency list", "BFS", "DFS", "union find", "cycle"] },
  { topic: "Graphs", type: "video", difficulty: "hard", title: "Dijkstra's shortest path & topological sort",
    summary: "Greedy shortest paths with a priority queue (non-negative weights) and ordering a DAG.",
    url: yt("dijkstra algorithm topological sort explained"), tags: ["dijkstra", "weighted graph", "shortest path", "topological sort", "DAG"] },
  { topic: "Graphs", type: "practice", difficulty: "hard", title: "Graph practice set",
    summary: "Number of islands, course schedule (topological sort), network delay time (Dijkstra).",
    body: "Always write down: directed or undirected? weighted? can it have cycles? That picks the algorithm.",
    tags: ["islands", "course schedule", "network delay", "practice"] },
  // ---- Dynamic Programming
  { topic: "Dynamic Programming", type: "note", difficulty: "medium", title: "DP: overlapping subproblems & optimal substructure",
    summary: "Memoization (top-down) vs tabulation (bottom-up); turning exponential recursion into polynomial time.",
    body: "DP applies when a problem has optimal substructure and overlapping subproblems. Memoized Fibonacci is O(n) instead of O(2^n). Define the state, the transition, and the base case.",
    tags: ["memoization", "tabulation", "fibonacci", "state"] },
  { topic: "Dynamic Programming", type: "video", difficulty: "hard", title: "0/1 knapsack and longest common subsequence",
    summary: "Classic 2D DP tables: knapsack in O(nW) and LCS in O(mn).",
    url: yt("0/1 knapsack longest common subsequence dynamic programming"), tags: ["knapsack", "LCS", "2D DP"] },
  { topic: "Dynamic Programming", type: "practice", difficulty: "hard", title: "DP practice set",
    summary: "Climbing stairs, coin change, longest increasing subsequence, edit distance.",
    body: "Start with the recursive solution, add memoization, then convert to a table.",
    tags: ["coin change", "climbing stairs", "edit distance", "practice"] },
];

const q = (topic, question, options, answerIndex, explanation, difficulty = "easy") =>
  ({ topic, question, options, answerIndex, explanation, difficulty });

export const questions = [
  q("Arrays", "What is the time complexity of accessing arr[i] in an array?", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 0, "Contiguous memory lets you compute the address directly."),
  q("Arrays", "Worst-case time to insert at the beginning of an array of n elements?", ["O(1)", "O(log n)", "O(n)", "O(n²)"], 2, "Every element must shift one position right."),
  q("Arrays", "Finding a pair with a given sum in a sorted array using two pointers takes:", ["O(n²)", "O(n)", "O(log n)", "O(n log n)"], 1, "Each step moves one pointer inward, so at most n steps.", "medium"),
  q("Arrays", "Kadane's algorithm is used to find the:", ["Maximum subarray sum", "Kth smallest element", "Longest increasing subsequence", "Majority element"], 0, "It tracks the best sum ending at each index.", "medium"),
  q("Arrays", "Binary search requires the array to be:", ["Of even length", "Sorted", "Free of duplicates", "Stored in a linked list"], 1, "Halving only works if order tells you which side to discard."),

  q("Linked Lists", "Time to access the k-th element of a singly linked list?", ["O(1)", "O(k)", "O(log k)", "O(k²)"], 1, "You must follow k next pointers from the head."),
  q("Linked Lists", "Which technique detects a cycle in a linked list using O(1) extra space?", ["Hashing visited nodes", "Floyd's tortoise and hare", "Binary search", "Sorting the nodes"], 1, "A fast and a slow pointer meet if there is a cycle.", "medium"),
  q("Linked Lists", "Inserting a new node at the head of a singly linked list takes:", ["O(1)", "O(n)", "O(log n)", "O(n log n)"], 0, "Point the new node at the old head and update head."),
  q("Linked Lists", "Iteratively reversing a singly linked list typically uses which pointers?", ["head and tail only", "prev, curr and next", "only curr", "left and right"], 1, "Save next, flip curr.next to prev, then advance both.", "medium"),
  q("Linked Lists", "Main advantage of a doubly linked list over a singly linked list?", ["Uses less memory", "O(1) random access", "Can traverse in both directions", "Always sorted"], 2, "The prev pointer allows backward traversal."),

  q("Stacks & Queues", "A stack follows which order?", ["FIFO", "LIFO", "Random", "Priority"], 1, "Last in, first out."),
  q("Stacks & Queues", "Which data structure is best for checking balanced parentheses?", ["Queue", "Stack", "Heap", "Hash map"], 1, "Push openers, pop and match on closers."),
  q("Stacks & Queues", "Breadth-first search uses which data structure?", ["Stack", "Queue", "Heap", "Trie"], 1, "BFS processes nodes in the order they were discovered."),
  q("Stacks & Queues", "Amortised cost of dequeue in a queue built from two stacks?", ["O(1)", "O(log n)", "O(n)", "O(n²)"], 0, "Each element moves between stacks at most once.", "medium"),
  q("Stacks & Queues", "'Next greater element' for every array item is solved in O(n) with a:", ["Monotonic stack", "Min-heap", "Binary search tree", "Circular queue"], 0, "The stack keeps candidates in decreasing order.", "medium"),

  q("Trees", "Inorder traversal of a binary search tree produces:", ["Reverse sorted order", "Sorted order", "Level order", "Random order"], 1, "Left subtree < node < right subtree."),
  q("Trees", "Height of a balanced binary tree with n nodes is:", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 1, "Each level roughly doubles the node count."),
  q("Trees", "Worst-case search time in an unbalanced BST with n nodes?", ["O(1)", "O(log n)", "O(n)", "O(n²)"], 2, "Inserting sorted keys makes the tree a chain.", "medium"),
  q("Trees", "Maximum number of nodes in a binary tree of height h (root at height 1)?", ["2h", "h²", "2^h - 1", "2^(h+1)"], 2, "1 + 2 + 4 + ... + 2^(h-1) = 2^h - 1.", "medium"),
  q("Trees", "Level-order traversal of a tree is implemented with a:", ["Stack", "Queue", "Hash set", "Priority queue"], 1, "It is BFS on the tree."),

  q("Graphs", "Which algorithm finds the shortest path in an unweighted graph?", ["DFS", "BFS", "Prim's", "Kruskal's"], 1, "BFS reaches nodes in increasing number of edges."),
  q("Graphs", "Dijkstra's algorithm can give wrong answers when the graph has:", ["Cycles", "Negative edge weights", "More than 1000 nodes", "Undirected edges"], 1, "It assumes a settled node's distance never decreases.", "medium"),
  q("Graphs", "Topological sorting is possible only for a:", ["Complete graph", "Directed acyclic graph", "Undirected tree", "Bipartite graph"], 1, "A cycle means no valid ordering exists.", "medium"),
  q("Graphs", "Space used by an adjacency list for V vertices and E edges?", ["O(V²)", "O(V + E)", "O(E²)", "O(V log E)"], 1, "One list entry per vertex plus one per edge."),
  q("Graphs", "Which structure efficiently detects a cycle in an undirected graph while adding edges?", ["Union-Find (disjoint set)", "Min-heap", "Trie", "Segment tree"], 0, "If both ends are already in the same set, the edge closes a cycle.", "hard"),

  q("Dynamic Programming", "Dynamic programming applies when a problem has:", ["Greedy choice only", "Optimal substructure and overlapping subproblems", "Sorted input", "No recursion"], 1, "Reuse solutions of repeated subproblems.", "medium"),
  q("Dynamic Programming", "Time complexity of Fibonacci with memoization?", ["O(2^n)", "O(n²)", "O(n)", "O(log n)"], 2, "Each fib(i) is computed once."),
  q("Dynamic Programming", "0/1 knapsack with n items and capacity W runs in:", ["O(n + W)", "O(nW)", "O(2^n)", "O(n log W)"], 1, "The table has n × W cells, O(1) work each.", "hard"),
  q("Dynamic Programming", "Top-down dynamic programming is also called:", ["Tabulation", "Memoization", "Backtracking", "Divide and conquer"], 1, "Recursion plus a cache of results."),
  q("Dynamic Programming", "Longest common subsequence of strings of length m and n takes:", ["O(m + n)", "O(mn)", "O(2^(m+n))", "O(m log n)"], 1, "Fill an (m+1) × (n+1) table.", "hard"),
];

// Seeded students. `skill` = probability of answering a question in that
// topic correctly; `days` = how many daily quizzes of history to generate.
// All seeded accounts use the password 123456.
const T = (arrays, lists, stacks, trees, graphs, dp) => ({
  Arrays: arrays,
  "Linked Lists": lists,
  "Stacks & Queues": stacks,
  Trees: trees,
  Graphs: graphs,
  "Dynamic Programming": dp,
});

// `teacher` = index into `teachers` below (the student → teacher mapping).
export const students = [
  { name: "Demo Student", email: "demo@learnpath.com", teacher: 0, days: 14, skill: T(0.9, 0.75, 0.7, 0.5, 0.3, 0.25) },
  { name: "Aarav Sharma", email: "aarav@learnpath.com", teacher: 0, days: 18, skill: T(0.95, 0.9, 0.85, 0.85, 0.75, 0.4) },
  { name: "Priya Verma", email: "priya@learnpath.com", teacher: 0, days: 12, skill: T(0.45, 0.4, 0.7, 0.9, 0.8, 0.6) },
  { name: "Rohan Mehta", email: "rohan@learnpath.com", teacher: 1, days: 10, skill: T(0.6, 0.6, 0.55, 0.6, 0.55, 0.5) },
  { name: "Sneha Gupta", email: "sneha@learnpath.com", teacher: 1, days: 16, skill: T(0.85, 0.8, 0.9, 0.35, 0.3, 0.7) },
  { name: "Kabir Singh", email: "kabir@learnpath.com", teacher: 1, days: 5, skill: T(0.4, 0.3, 0.35, 0.25, 0.2, 0.15) },
];

// Teachers see only their own students; the admin sees everyone and can reassign.
export const teachers = [
  { name: "Prof. Anjali Rao", email: "teacher@learnpath.com" },
  { name: "Prof. Vikram Iyer", email: "teacher2@learnpath.com" },
];
export const admin = { name: "Admin", email: "admin@learnpath.com" };
