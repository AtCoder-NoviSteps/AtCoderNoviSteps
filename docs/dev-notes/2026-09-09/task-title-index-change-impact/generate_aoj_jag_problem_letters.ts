/**
 * Throwaway script for PR2 (see plan-pr2.md). Committed once for traceability, then deleted.
 *
 * Builds the AOJ problem id -> problem letter table for the JAG training camps and JAG Regional
 * from prisma/tasks.ts. Letters come from the position in the maintainer's problem list (a
 * spreadsheet) transcribed in OFFICIAL_CONTESTS, skipping problems absent from AOJ's contest
 * listing. Prints the table as JSON only when every title matches.
 *
 * Usage:
 *   pnpm exec tsx docs/dev-notes/2026-09-09/task-title-index-change-impact/generate_aoj_jag_problem_letters.ts
 */
import { tasks } from '../../../../prisma/tasks';

const TARGET_CONTEST_ID = /^JAG(Summer|Winter|Spring|Regional)\d{4}(-day\d+[A-Z]?)?$/;
const EXPECTED_CONTEST_COUNT = 66;
const EXPECTED_TASK_COUNT = 625;
const TRUNCATION_MARK = '…';

interface OfficialContest {
  /** Official titles in letter order. A trailing "…" marks a title cut off in the spreadsheet. */
  titles: string[];
  /** Letters of official problems absent from prisma/tasks.ts (not in AOJ's contest listing). */
  absentLetters: string[];
}

type Problem = { id: string; name: string };

function official(titles: string[], absentLetters: string[] = []): OfficialContest {
  return { titles, absentLetters };
}

// Transcribed from the maintainer's spreadsheet (screenshots of 2026-10-24, rows 2-1025).
const OFFICIAL_CONTESTS: Record<string, OfficialContest> = {
  'JAGSummer2024-day2': official([
    'Add Add Add',
    'Broken Parentheses',
    'Convenient Banknotes',
    'Do Make Segment Tree',
    'Expression Sum',
    'Flip Path on Rooted Tree',
    'Give Me a Lot of Triangles',
    'Half Plane Painting',
    'I Love Square Number',
    'Just Believe in Binary Search',
    'K-th Nondivisor',
    'Linear Time Inversion Number',
    'Max Sum of GCD',
    'Noncoprime Subsequences',
  ]),
  'JAGSummer2024-day3': official(
    [
      'Tower Defense',
      'Renovation',
      'Commutativity',
      'Paper Cut Game',
      'Ball Passing',
      'Halfway Through the Book',
      'Interactive String Guessing',
      'Coins on a Tree',
      'Fragile Tree',
      'Draw the Tree',
      'Equal or Not Equal',
    ],
    ['G'],
  ),
  'JAGSummer2023-day2': official([
    'Sum of Product of Binomial Coefficients',
    'Mercurialist',
    'Umbrella Queries',
    'Gemini Tree (Ver.Jadeite)',
    'Gemini Tree (Ver.Lapislazuli)',
    'Tea time in the grand garden',
    'Fraises dans une boite',
    'Empty Quartz',
    'Distance Permutation',
    'Knight Game',
    'Drifting',
    'Disjoint-Sparse-Table Optimization',
  ]),
  'JAGSummer2023-day3': official([
    'Roller Coaster',
    'Break a Prison',
    'Camp room assignment',
    'Many-hued Tree',
    'Gacha 101',
    'Digit-only subrectangles',
    'Convex Polygon MST',
    'LCP Queries',
    'Best parentheses',
    'Edit distance on table',
    'Odd trip plans',
  ]),
  JAGRegional2022: official([
    'Stop and Go',
    '1-Player Concentration',
    'Track Train Trail',
    '2-LIS',
    'Sharp 2-SAT',
    'Seimei Handan 999.0',
    'Avoid bombings',
    'Sloppy city planning',
    'N-1 Truths and a Lie',
    'Most distant point from the stations',
    'Sort Compressed Strings',
    'Tree Automorphism',
  ]),
  JAGRegional2021: official([
    'Harvest',
    'Parse the Syntax Tree',
    'Permutation Magic',
    'MFP: Most Fluctuated Player',
    "Underground's SUNDAY",
    'qarentheziz zepuence',
    'Pizza delivery',
    'include',
    '(N+1)-legged race',
    'Isomorphic?',
    'Zombie Land 2',
  ]),
  JAGRegional2020: official([
    'On-Call',
    'Warp Points',
    'Rebound Sequences',
    'Surround the Castle',
    'Buttons',
    'Mountain View',
    'Yet Another Expression Mining',
    'Aggressive Traveller',
    'Irreversible Reactions',
    'X-percent Blooming',
    'Feed candies',
  ]),
  'JAGSummer2019-day1': official([
    'AIGo',
    'Non-trivial Common Divisor',
    'Universal and Existential Quantifiers',
    'Permutation Sort',
    'Consistent Trading',
    'All your base are belong to us',
    'Route Calculator Returns',
    'N-by-M grid calculation',
    'Zombie Land',
    'Rooks Game',
    'Bombing',
  ]),
  'JAGSummer2019-day2': official([
    'Undo Swapping',
    'Spent Fuel Disposal',
    'Cyclic String',
    'Nose And Lung',
    'Expensive Function',
    'Clique Drawing',
    'Human Seperation',
    'Permutation Score',
    'Palindrome Compliment',
    'Prefix Suffix Nim',
  ]),
  'JAGSummer2019-day3': official([
    'Union Ball',
    'AddMulSubDiv',
    'Shuttle Run',
    'XORANDORBAN',
    'Red Black Balloons',
    'Invariant Tree',
    'Toss Cut Tree',
    'Colorful Tree',
    'Add',
    'Horizontal-Vertical Permutation',
  ]),
  'JAGSummer2018-day3': official([
    'GuruGuru',
    'Colorful Drink',
    "Santa's Gift",
    'Prefix Suffix Search',
    'Magic Triangles',
    'Nim without Zero',
    'Additions',
    'Enlarge Circles',
    'Sum of QQ',
    'Prime Routing',
    'Rough Sorting',
  ]),
  JAGRegional2017: official([
    'Window',
    'Tournament Chart',
    'Prime-Factor Prime',
    'Revenge of the Broken Door',
    'Tree Separator',
    'RPG Maker',
    'Coin Slider',
    'Separate String',
    'Revenge of the Endless BFS',
    'Farm Village',
    'Conveyor Belt',
  ]),
  'JAGSummer2017-day3': official([
    'Star in Parentheses',
    'Slimming Plan',
    'Ninja Map',
    'Janken Master',
    'Route Calculator',
    'Endless BFS',
    'Low Range-Sum Matrix',
    'Tiny Room',
    "Librarian's Work",
    'Sum Source Detection',
    'Permutation Period',
  ]),
  JAGRegional2016: official([
    'Best Matched Pair',
    'Help the Princess!',
    "We don't wanna work!",
    'Parentheses',
    'Similarity of Subtrees',
    'Escape from the Hell',
    'Share the Ruins Preservation',
    'Pipe Fitter and the Fierce Dogs',
    'Multisect',
    'Compressed Formula',
    'Non-redundant Drive',
  ]),
  JAGRegional2015: official([
    'M and A',
    'Change a Password',
    'Delete Files',
    'Line Gimmick',
    'Shifting a Matrix',
    'Modern Announce Network',
    'Cube Dividing',
    'Donut Decoration',
    'Shortest Bridge',
    'Longest Shortest Path',
    'Optimal Tournament',
  ]),
  'JAGSummer2015-day2': official([
    "Let's Solve Geometric Problems",
    'Jail',
    'ABC Gene',
    'Dark Room',
    'An Equation in a Mine',
    'Nearly Cyclic String',
    'Escape',
    'Bit Operation Game',
    'Twin Reverse',
    'Connection',
    'Leapfrog',
  ]),
  'JAGSummer2015-day4': official([
    'Where is the Boundary',
    'Vector Field',
    'Kuru Kuru Sushi',
    'Identity Function',
    'Enclose Points',
    'Marching Course',
    'Surface Area of Cubes',
    'Laser Cutter',
    'Live Programming',
    'Black Company',
  ]),
  JAGSpring2015: official([
    'Balanced Paths',
    'Card Game Strategy',
    'Casino',
    'Content Delivery',
    'Cost Performance Flow',
    'ICPC Teams',
    'JAG-channel II',
    'Kimagure Cleaner',
    'Midpoint',
    'New Game AI',
    'Runner and Sniper',
    'Wall Making Game',
  ]),
  'JAGSummer2014-day2': official([
    'Manhattan',
    'Dictionary',
    'Clique Coloring',
    'Dense Amidakuji',
    'Cellular Automaton',
    'Directions',
    'Snake',
    'Distance Sum',
    'Substring Pairs',
    'Hyperrectangle',
  ]),
  JAGRegional2014: official([
    'North North West',
    'Unknown Switches',
    'Speedrun',
    'Flowers',
    'Square in Circles',
    'Reverse a Road II',
    'Cookie Counter',
    'Points and Lines',
    'Color the Map Extreme',
    'Website Tour',
    'Idempotent Filter',
  ]),
  'JAGSummer2014-day4': official([
    'Yamanote Line',
    'Prowler',
    'Magic Bullet',
    'Dinner',
    'AI',
    'Longest Match',
    'Recycle',
    'Tournament',
    'The Capital',
    'Vongress',
  ]),
  JAGSpring2014: official([
    'Breadth-First Search by Foxpower',
    'Cube Coloring',
    'Decoding Ancient Messages',
    'LR',
    'Parentheses',
    'Polygon Guards',
    'Proportional Representation',
    'RLE Replacement',
    'Tokyo Olympics Center',
    'Unfair Game',
  ]),
  JAGRegional2013: official(
    [
      'Broken Audio Signal',
      'Restore Calculation',
      'SIRO Challenge',
      'Everlasting -One-',
      'Putter',
      'Shipura',
      'Floating Islands',
      'Venn Diagram',
      'Overwriting Game',
      'Magical Switches',
    ],
    ['A', 'B', 'C'],
  ),
  'JAGSummer2013-day2': official([
    'Koto Distance',
    'Evacuation Route',
    'Apples',
    'TiMe Table',
    'Pattern Language',
    'Social Monsters',
    'Perm Query',
  ]),
  'JAGSummer2013-day3': official([
    'Invest Master',
    'Minus One',
    'Wave Attack',
    'Fast Division',
    'Ordering',
    'Phutball',
    'Unordered Operators',
    'Almost Same Substring',
    'A + B',
    'KuruKuruKururin',
    'Air Pollution',
    'Trip to Kyoto',
  ]),
  'JAGSummer2013-day4': official([
    'Thread Tree',
    'Trodden Cable',
    'Fox Observation',
    'Removing Magical Tiles',
    'Optimal alpha beta pruning',
    'Graph Automata Player',
    'Spotlight Movement',
    'Gravity Point',
    'Multi Path Story',
    'Rotation Game',
  ]),
  JAGSpring2013: official([
    'Everlasting Zero',
    'Integer in Integer',
    'Iyasugigappa',
    'Medical Inspection',
    'Minimum Spanning Tree',
    'Point Distance',
    'Revenge of Minimum Cost Flow',
    'Rings',
    'The J-th Number',
    'Tree Reconstruction',
  ]),
  JAGRegional2012: official([
    'Dictionary',
    "Texas hold 'em",
    'Median Tree',
    'Billiard',
    'Stack Maze',
    "Counting 1's",
    'Ancient Commemorative Monolith',
    'Magical Bridges',
    'Hashigo Sama',
    'Ancient Scrolls',
  ]),
  'JAGSummer2012-day2': official([
    'Kakezan',
    'A Holiday of Miss Brute Force',
    'Treasure Hunt',
    'hosonagaitokoro',
    'Lost Number',
    'marukaite',
    'Longest Increasing Sequence',
    'House Moving',
    'Sports Days 2.0',
    'Final Defense Line',
  ]),
  'JAGSummer2012-day3A': official([
    'Audition',
    'Zero Division Checker',
    'Card',
    'DNA',
    'YAML',
    'Hakone',
  ]),
  'JAGSummer2012-day3B': official([
    'Kagisys',
    'FizzBuzz',
    'ConvexCut',
    'ReverseSort',
    'Substring',
    'MinimumCostPath',
    'Enumeration',
  ]),
  'JAGSummer2012-day4': official([
    'A Two Floors Dungeon',
    'Area Folding',
    'Connect',
    'Do use segment tree',
    'Move on Dice',
    'Pipeline Plans',
    'Presentation',
    'Repairing',
    'Sun and Moon',
    'Usoperanto',
  ]),
  JAGSpring2012: official([
    'Asynchronous Exceptions',
    'AYBABTU',
    'Billiards Sorting',
    'Digit',
    'Dungeon Creation',
    'Longest Lane',
    'Play in Basic',
    'Skyland',
    'Three-way Branch',
    'Tree Allocation',
  ]),
  JAGWinter2011: official([
    "Carpenters' Language",
    'Kth Sentence',
    'Light Road',
    'Matrix Operation',
    'Multi Ending Story',
    'Network Reliability',
    'Runaway Domino',
    'Sunny Graph',
    'Testing Circuits',
    'World Trip',
  ]),
  JAGRegional2011: official([
    'Infinity Maze',
    'Butterfly',
    'Chinese Classics',
    'Revenge of Champernowne Constant',
    'Full Text Search',
    'Mysterious Maze',
    'Number Sorting',
    'Sky Jump',
    'Mobile Network',
    'Blue Forest',
  ]),
  'JAGSummer2011-day2': official([
    'Attack the Moles',
    'Brilliant Stars',
    'Common Palindromes',
    'Dangerous Tower',
    'Entangled with Lottery',
    'Power of Power',
    'Quest of Merchant',
    'Rectangular Stamps',
    'Starting Line',
    'Tiles are Colorful',
  ]),
  'JAGSummer2011-day3': official([
    'Calender Colors',
    'Sleeping Time',
    'On or Off',
    'Marathon Match',
    'Reverse Roads',
    'Beautiful Currency',
    'Rabbit Party',
    'Palindrome Generator',
    'White Bird',
    'Vector Compression',
  ]),
  'JAGSummer2011-day4': official([
    'Rose Garden Witch',
    'Dessert Witch',
    'Magical Girl Sayaka-chan',
    'Box Witch',
    'Scribbling witch',
    'Shadow Witch',
    'Mermaid Witch',
    'Class Representative Witch',
    'Set-constructing Witch',
    'Soul Gem Game',
  ]),
  'JAGWinter2010-day3': official([
    'CatChecker',
    'RabbitWalking',
    'TransferTrain',
    'IkaNumber',
    'HullMarathon',
    'RabbitLunch',
    'CarrotBreeding',
    'DisconnectedGame',
    'ThreeRooks',
    'SolveMe',
  ]),
  'JAGWinter2010-day4': official([
    'Bicube',
    'Bubble Puzzle',
    'Fair Game',
    'King Slime',
    'Rabbit Game Playing',
    'Rabbit Jumping',
    'Shelter',
    'Sightseeing Tour',
    'Tampopo Machine',
    'Top of the Hill',
  ]),
  JAGRegional2010: official([
    'Era Name',
    'Step Step Evolution',
    'Dungeon Quest II',
    'Dice Room',
    'Alice and Bomb',
    'Two-Wheel Buggy',
    'Camera Control',
    'Road Construction',
    'Operator',
    'Merry Christmas',
  ]),
  'JAGSummer2010-day2': official([
    'Earth Invasion Diary of Miyabi-sensei',
    'A Way to Invite Friends',
    'Space-Time Sugoroku Road',
    'My friends are small',
    'Roads on Towns',
    '10-Year-Old Dynamic Programming',
    'Spring Tiles',
    'Remodeling Plan for Neko-Nabe (tentative)',
    'Intelligible Double Magic',
    "Person responsible for problem description don't w…",
  ]),
  'JAGSummer2010-day3': official([
    'Ennichi',
    'Carrot Tour',
    'Usagitobi',
    'Graph Construction',
    'Rabbit Plays Games!',
    'The Castle',
    'Nurie',
    'Nearest Station',
    'Lapin Noir',
    'Usaneko Matrix',
  ]),
  'JAGSummer2010-day4': official([
    "Alien's Counting",
    'Kaeru Jump',
    'Save your cats',
    'Dungeon Wall',
    'Psychic Accelerator',
    'Bouldering',
    "DON'T PANIC!",
    'Ropeway',
    'How to Create a Good Game',
    'Cruel Bingo',
  ]),
  JAGWinter2009: official([
    'Approximate Circle',
    'Blame Game',
    'Earn Big',
    'Exportation in Space',
    'Laser Puzzle',
    'Magnum Tornado',
    "Nezumi's Treasure",
    'Testing Sorting Networks',
    'Train King',
    'Tree Construction',
  ]),
  JAGRegional2009: official([
    'Whist',
    'For the Peace',
    'Champernowne Constant',
    'Futon',
    'Safe Area',
    'Water Tank',
    "Neko's Treasure",
    'Eleven Lover',
    'Crystal Jails',
    'Cave Explorer',
  ]),
  'JAGSummer2009-day2': official([
    'Infected Computer',
    'Magic Slayer',
    'Dial Lock',
    'Double Sorting',
    'Symmetry',
    'Voronoi Island',
    'Defend the Bases',
    'Galaxy Wide Web Service',
    'Tatami',
    'Revenge of the Round Table',
  ]),
  'JAGSummer2009-day3': official([
    'Strange String Manipulation',
    'Erratic Sleep Habits',
    'Find the Point',
    "Luigi's Tavern",
    'Colored Octahedra',
    'Marked Ancestor',
    'Strange Couple',
    "Queen's Case",
    'Wind Passages',
    'Secret Operation',
  ]),
  'JAGWinter2008-day2': official([
    'Adhoc Translation',
    'Artistic Art Museum',
    'Complex Integer Solutions',
    'Dial Key',
    'Dungeon Master',
    'Exciting Bicycle',
    'Fuel Problem',
    'Magic Walls',
    'Sort by Hand',
    'Substring Expression',
    'Up Above the World So High',
  ]),
  'JAGWinter2008-day3': official([
    'Cache Control',
    'Cover Time',
    'Craftsman',
    'Divide the Water',
    "Mickle's Beam",
    'Poor Computer',
    'Riffle Swap',
    'Round Table',
    'Strange Currency System',
    'Tangram',
    'Trading Ship',
  ]),
  JAGRegional2008: official(
    [
      'Everlasting...?',
      'Headstrong Student',
      'Dig or Climb',
      'Rotation Estimation',
      'Optimal Rest',
      'Controlled Tournament',
      'Entangled Tree',
      'Ramen Shop',
      "Cousin's Aunt",
      'Colony Maintenance',
    ],
    ['J'],
  ),
  'JAGSummer2008-day2': official([
    'Pi is Three',
    'Left Hand Rule',
    'Alice and Bob',
    'Deadly Dice Game',
    'Reverse a Road',
    'Webby Subway',
    'Time Trial',
    'Vending Machine',
    'Memory Match',
    'Tile Puzzle',
  ]),
  'JAGSummer2008-day4': official([
    "Girls' Party",
    'Bitwise Kingdom',
    'Adaptive Time Slicing Quantization',
    'Reaction',
    'Magical Island',
    'Ninja Legend',
    'Do It',
    'Robot Communication',
  ]),
  'JAGWinter2007-day2': official([
    'Defend the Nation',
    'Electrophoretic',
    'Median Filter',
    'Life Game',
    'Subdividing a Land',
    'Connect Line Segments',
    'Oil Company',
    'Finding the Top RPS Player',
    'Revenge of Voronoi',
    'Castle Wall',
  ]),
  'JAGWinter2007-day3': official(
    [
      'Optimization of Combinatorial Circuits',
      'Divisor Function',
      'Magical Dungeon',
      'Land Mark',
      'Networking Company',
      'Alien Pianist',
      'Japanese Style Pub',
      'Two Rings',
      'Text Justification',
      'Billion Million Thousand',
    ],
    ['E'],
  ),
  JAGRegional2007: official([
    'Space Coconut Crab II',
    'Sort the Panels',
    'Disarmament of the Units',
    'So Sleepy',
    'Alice in Foxland',
    'Lying about Your Age',
    'Turn Polygons',
    "Robots' Crash",
    'Linear Ether Geometry',
  ]),
  'JAGSummer2007-day1': official([
    'Dance Dance Revolution',
    'Compress Files',
    'Save the Energy',
    'Goofy Converter',
    'Black Force',
  ]),
  'JAGSummer2007-day2': official([
    'Hit and Blow',
    'Turn Left',
    '!',
    'Speed',
    'Spirograph',
    'Mysterious Dungeons',
    'Repeated Subsequences',
    'Petoris',
    'Pythagoraslope',
  ]),
  'JAGSummer2007-day3': official([
    'Election',
    'Jaggie Spheres',
    'Nagashi Soumen',
    'Private Teacher',
    'Triangles',
    'Two-finger Programming',
    'Walk under a Scorching Sun',
  ]),
  'JAGWinter2006-day2': official(
    [
      'Cells',
      'Japan',
      'Maximum',
      'The Phantom',
      'Payment System',
      'Rakunarok',
      'Roof',
      'Seminar Room',
      'String Compression',
    ],
    ['A', 'B', 'C', 'E', 'G', 'H', 'I'],
  ),
  'JAGWinter2006-day3': official(
    [
      'Dock to the Future',
      'Widget Factory',
      'Hills',
      'Flame of Nucleus',
      'Safe Packing',
      'The "Shortest" Pair of Paths',
      'Resource',
      'Exact Arithmetic',
      'Counting Triangles',
      'Wireing Assistant',
    ],
    ['B', 'C', 'E', 'F', 'I', 'J'],
  ),
  JAGRegional2006: official([
    'Ruins',
    'Hyper Rock-Scissors-Paper',
    'Online Quiz System',
    'Rock Man',
    'Autocorrelation Function',
    'It Prefokery Pio',
    'Traffic',
    'Restriction Enzyme',
    'The Extreme Slalom',
  ]),
  'JAGSummer2006-day1': official(
    ['Monkey Business', 'The Closest Circle', 'Sort that Queue'],
    ['A', 'C'],
  ),
  'JAGSummer2006-day2': official([
    'Moduic Squares',
    'Restaurant',
    'Tetrahedra',
    'International Party',
    'Hide-and-seek',
    'TV Watching',
    'Make Friendships',
    'Slippy Floors',
    'Roads in a City',
  ]),
  'JAGSummer2006-day3': official(
    [
      'Rolling Cubes',
      'Reading Brackets in English',
      'Grated Radish',
      'Greedy, Greedy.',
      'First Experience',
      'Web 0.5',
      "Philosopher's Stone",
    ],
    ['A'],
  ),
  JAGRegional2005: official(
    [
      'Blackjack',
      'Eight Princes',
      'Geometry?! Why Not??',
      'Divisor is the Conqueror',
      'Reading a Chord',
      'University Rankings',
      'Gather on the Clock',
      'Tiling Polygons',
      'Light The Room',
    ],
    ['C', 'F', 'H'],
  ),
};

// Ignore case, spacing, and punctuation, which differ between the spreadsheet and AOJ.
function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function matchesTitle(aojTitle: string, officialTitle: string): boolean {
  const normalizedAojTitle = normalizeTitle(aojTitle);
  const normalizedOfficialTitle = normalizeTitle(officialTitle);

  if (officialTitle.endsWith(TRUNCATION_MARK)) {
    return normalizedAojTitle.startsWith(normalizedOfficialTitle);
  }

  return normalizedAojTitle === normalizedOfficialTitle;
}

function toLetter(position: number): string {
  return String.fromCharCode(65 + position);
}

function groupTargetProblems(): Map<string, Problem[]> {
  const problemsByContest = new Map<string, Problem[]>();

  for (const task of tasks) {
    if (!TARGET_CONTEST_ID.test(task.contest_id)) {
      continue;
    }

    const problems = problemsByContest.get(task.contest_id) ?? [];
    problems.push({ id: task.id, name: task.name });
    problemsByContest.set(task.contest_id, problems);
  }

  for (const problems of problemsByContest.values()) {
    problems.sort((first, second) => Number(first.id) - Number(second.id));
  }

  return problemsByContest;
}

// Letters of the problems that AOJ lists, in order; absent ones are skipped, not shifted into.
function getPresentLetters({ titles, absentLetters }: OfficialContest): string[] {
  return titles
    .map((_title, position) => toLetter(position))
    .filter((letter) => !absentLetters.includes(letter));
}

function verifyContest(contestId: string, problems: Problem[]): string[] {
  const officialContest = OFFICIAL_CONTESTS[contestId];

  if (officialContest === undefined) {
    return [`${contestId}: not in the official list`];
  }

  const presentLetters = getPresentLetters(officialContest);
  const errors: string[] = [];

  if (problems.length !== presentLetters.length) {
    errors.push(
      `${contestId}: AOJ has ${problems.length} problems, expected ${presentLetters.length}`,
    );
  }

  problems.forEach((problem, position) => {
    const letter = presentLetters[position];
    const officialTitle =
      letter === undefined ? undefined : officialContest.titles[letter.charCodeAt(0) - 65];

    if (officialTitle === undefined || !matchesTitle(problem.name, officialTitle)) {
      errors.push(
        `${contestId} ${letter ?? '?'}: AOJ has "${problem.name}", expected "${officialTitle ?? '(none)'}"`,
      );
    }
  });

  return errors;
}

function main(): void {
  const problemsByContest = groupTargetProblems();
  const taskCount = [...problemsByContest.values()].reduce(
    (sum, problems) => sum + problems.length,
    0,
  );

  if (problemsByContest.size !== EXPECTED_CONTEST_COUNT || taskCount !== EXPECTED_TASK_COUNT) {
    throw new Error(
      `Extracted ${problemsByContest.size} contests / ${taskCount} tasks, expected ${EXPECTED_CONTEST_COUNT} / ${EXPECTED_TASK_COUNT}`,
    );
  }

  const errors = [...problemsByContest].flatMap(([contestId, problems]) =>
    verifyContest(contestId, problems),
  );
  const unknownContests = Object.keys(OFFICIAL_CONTESTS).filter(
    (contestId) => !problemsByContest.has(contestId),
  );

  errors.push(...unknownContests.map((contestId) => `${contestId}: not in prisma/tasks.ts`));

  console.error(`Contests: ${problemsByContest.size}, tasks: ${taskCount}`);

  if (errors.length > 0) {
    errors.forEach((error) => console.error(`ERROR ${error}`));
    process.exitCode = 1;

    return;
  }

  console.error(`All ${taskCount} titles match the official letters`);

  const letters: Record<string, string> = {};
  const overrides: [string, string, string][] = [];

  for (const [contestId, problems] of problemsByContest) {
    const presentLetters = getPresentLetters(OFFICIAL_CONTESTS[contestId]);
    const shifted = problems.some(
      (_problem, position) => presentLetters[position] !== toLetter(position),
    );

    problems.forEach((problem, position) => {
      letters[problem.id] = presentLetters[position];

      // Every row of a shifted contest is overridden, so the migration does not mix two rules.
      if (shifted) {
        overrides.push([contestId, problem.id, presentLetters[position]]);
      }
    });
  }

  console.error(
    `Contests that differ from the basic rule: ${new Set(overrides.map(([contestId]) => contestId)).size} / ${overrides.length} rows`,
  );
  console.log(JSON.stringify({ letters, overrides }, null, 2));
}

main();
