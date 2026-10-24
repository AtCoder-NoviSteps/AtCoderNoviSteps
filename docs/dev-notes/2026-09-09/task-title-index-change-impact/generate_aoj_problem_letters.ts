/**
 * Throwaway Phase 0 script for PR1 (see plan.md). Committed once for traceability, then deleted.
 *
 * Builds the AOJ problem id -> problem letter table for ICPC Prelim / ICPC Regional / JAG Prelim
 * from prisma/tasks.ts with the basic rule (ascending problem id within a contest), and verifies
 * every letter against the maintainer's problem list (a spreadsheet) transcribed in
 * OFFICIAL_CONTESTS. Prints the table as JSON only when every check passes.
 *
 * Usage:
 *   pnpm exec tsx docs/dev-notes/2026-09-09/task-title-index-change-impact/generate_aoj_problem_letters.ts
 */
import { tasks } from '../../../../prisma/tasks';

const TARGET_CONTEST_ID = /^(ICPCPrelim|ICPCRegional|JAGPrelim)\d{4}[AB]?$/;
const EXPECTED_CONTEST_COUNT = 79;
const EXPECTED_TASK_COUNT = 632;
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

// Transcribed from the maintainer's spreadsheet on 2026-10-21.
const OFFICIAL_CONTESTS: Record<string, OfficialContest> = {
  ICPCPrelim1998: official([
    'Area of Polygons',
    'A Simple Offline Text Editor',
    'Calculation of Expressions',
    'Board Arrangements for Concentration Games',
  ]),
  ICPCPrelim1999: official([
    "Where's Your Robot?",
    'Unable Count',
    'Factorization of Quadratic Formula',
    'Spiral Footrace',
    'A Long Ride on a Railway',
  ]),
  ICPCPrelim2000: official(["Fermat's Last Theorem", 'Patience', 'Cyber Guardian', 'Strange Key']),
  ICPCPrelim2001: official([
    'Get a Rectangular Field',
    'Multi-column List',
    'Jigsaw Puzzles for Computers',
    'Missing Numbers',
    'Nets of Dice',
  ]),
  ICPCPrelim2002: official(
    [
      'Exploring Caves',
      'Pile Up!',
      'Kanglish:Analysis on Artificial Language',
      'What is the Number in my Mind ?',
      'Enclosing Circles',
    ],
    ['E'],
  ),
  ICPCPrelim2003: official([
    'When Can We Meet?',
    'Get Many Persimmon Trees',
    'The Secret Number',
    'Building a Space Station',
    'Square Carpets',
  ]),
  ICPCPrelim2004: official([
    'Hanafuda Shuffle',
    'Red and Black',
    'Unit Fraction Partition',
    'Circle and Points',
    'Water Tank',
    'Name the Crossing',
  ]),
  ICPCPrelim2005: official([
    "Ohgas' Fortune",
    'Polygonal Line Search',
    'Numeral System',
    'Traveling by Stagecoach',
    'Earth Observation with a Mobile Robot Team',
    'Cleaning Robot',
  ]),
  ICPCPrelim2006: official([
    "Dirichlet's Theorem on Arithmetic Progressions",
    'Organize Your Train part II',
    'Hexerpents of Hexwamp',
    'Curling 2.0',
    'The Genome Database of All Space Life',
    'Secrets in Shadows',
  ]),
  ICPCPrelim2007: official([
    'ICPC Score Totalizer Software',
    'Analyzing Login/Logout Records',
    'Cut the Cake',
    'Cliff Climbing',
    'Twirl Around',
    'Dr. Podboq or: How We Became Asymmetric',
  ]),
  ICPCPrelim2008: official([
    'Equal Total Scores',
    'Monday-Saturday Prime Factors',
    'How can I satisfy thee? Let me count the ways...',
    'Twirling Robot',
    'Roll-A-Big-Ball',
    'ICPC: Intelligent Congruent Partition of Chocolat…',
  ]),
  ICPCPrelim2009: official([
    'Next Mayor',
    'How Many Islands?',
    'Verbal Arithmetic',
    'Discrete Speed',
    'Cards',
    'Tighten Up!',
  ]),
  ICPCPrelim2010: official([
    "Pablo Squarson's Headache",
    'Amazing Mazes',
    "Pollock's conjecture",
    'Off Balance',
    'The Most Powerful Spell',
    'Old Memories',
    'Laser Beam Reflections',
  ]),
  ICPCPrelim2011: official([
    "Chebyshev's Theorem",
    'The Balance of the World',
    'Identically Colored Panels Connection',
    'And Then. How Many Are There?',
    'Planning Rolling Blackouts',
    'Watchdog Corporation',
    'A Broken Door',
  ]),
  ICPCPrelim2012: official([
    'Millennium',
    'Recurring Decimals',
    'Biased Dice',
    'Railway Connection',
    'Chain-Confined Path',
    'Generic Poker',
    'Patisserie ACM',
  ]),
  ICPCPrelim2013: official([
    'Integral Rectangles',
    'ICPC Ranking',
    'Hierarchical Democracy',
    'Prime Caves',
    'Anchored Balloon',
    'Rotate and Rewrite',
  ]),
  ICPCPrelim2014: official([
    'Tax Rate Changed',
    'Chain Disappearance Puzzle',
    'Vampire',
    'Encryption System',
    'Bridge Removal',
    'A Die Maker',
    "Don't Cross the Circles!",
  ]),
  ICPCPrelim2015: official([
    'Entrance Examination',
    'Short Phrase',
    'ICPC Calculator',
    '500-yen Saving',
    'Deadlock Detection',
    'Bridge Construction Planning',
    'Complex Paper Folding',
    'Development of Small Flying Robots',
  ]),
  ICPCPrelim2016: official([
    'Selection of Participants of an Experiment',
    'Look for the Winner!',
    'Bamboo Blossoms',
    'Daruma Otoshi',
    '3D Printing',
    'Deciphering Characters',
    'Warp Drive',
    'Gift Exchange Party',
  ]),
  ICPCPrelim2017: official([
    "Taro's Shopping",
    'Almost Identical Programs',
    'A Garden with Ponds',
    'Making Lunch Boxes',
    'Boolean Expression Compressor',
    'Folding a Ribbon',
    'Go around the Labyrinth',
    'Equivalent Deformation',
  ]),
  ICPCPrelim2018: official([
    'Income Inequality',
    'Origami, or the art of folding paper',
    'Skyscraper MinatoHarukas',
    'Playoff by all the teams',
    'Floating-Point Numbers',
    'Equilateral Triangular Fence',
    'Expression Mining',
    'For Programming Excellence',
  ]),
  ICPCPrelim2019: official([
    'Scores of Final Examination',
    'On-Screen Keyboard',
    'Balance Scale',
    'Tally Counters',
    'Cube Surface Puzzle',
    'Flipping Colors',
    "Let's Move Tiles!",
    'Addition on Convex Polygons',
  ]),
  ICPCPrelim2020: official([
    'Count Up 2020',
    'Contact Tracer',
    'Luggage',
    'Icpcan Alphabet',
    'Keima',
    'Evacuation Site',
    'Avoiding Three Cs',
    'Idealistic Canister',
  ]),
  ICPCPrelim2021: official([
    'Marbles Tell Your Lucky Number',
    'Hundred-Cell Calculation Puzzles',
    'Tree Transformation Puzzle',
    'Handing out Balloons',
    'Time is Money',
    "Princess' Perfectionism",
    'Positioning the Lights',
    'Ninja Escape',
  ]),
  ICPCPrelim2022: official([
    'Counting Peaks of Infection',
    'Leave No One Behind',
    'Training Schedule for ICPC',
    'Audience Queue',
    'Village of Lore',
    'Trim It Step by Step',
    'Keep in Touch',
    'Artist in Agony',
  ]),
  ICPCPrelim2023: official([
    'Which Team Should Receive the Sponsor Prize…',
    'Amidakuji',
    'Changing the Sitting Arrangement',
    'Efficient Problem Set',
    'Tampered Records',
    'Villa of Emblem Shape',
    'Fair Deal of Dice',
    'Planning Locations of Bus Stops',
  ]),
  ICPCPrelim2024: official([
    'Snacks within 300 Yen',
    'Overtaking',
    'Honeycomb Distance',
    "A Bug That's Not a Pill Bug",
    'Colorful Residential Area',
    'Billiards',
    'Two Sets of Cards',
    'Blocking the Way',
    'All Survived?',
  ]),
  ICPCPrelim2025: official([
    '2025',
    'Prefix and Suffix Can Be the Same',
    'Calendar of an Enthusiastic Worker',
    'Ancient Game Board',
    'To Be Discontinued',
    'Dog Tricks',
    'Number of Faces',
    'Parentheses',
    'Preparing the Lunch',
  ]),
  ICPCPrelim2026: official([
    'Find the Strongest Card',
    'Vending Machines',
    'Water Remaining',
    'Frequency Sequence',
    'Shopping Master',
    'Optimizing a Map Application',
    'Avoid Collision',
    'Sorting Swim Rings',
    'Speed Limit',
    'Maximum Scaling',
  ]),
  ICPCRegional1998: official([
    "Goldbach's Conjecture",
    'Lattice Practices',
    'Mobile Phone Coverage',
    "Napoleon's Grumble",
    'Pipeline Scheduling',
    'Triangle Partition',
    'BUT We Need a Diagram',
    'Digital Racing Circuil',
  ]),
  ICPCRegional1999: official([
    'Rational Irrationals',
    'Square Coins',
    'Die Game',
    'Trapezoids',
    'Mirror Illusion',
    'Heavenly Jewels',
    'Walking Ant',
    'Co-occurrence Search',
  ]),
  ICPCRegional2000: official([
    'Lost in Space',
    'Family Tree',
    'Push!!',
    'Pump up Batteries',
    'The Devil of Gravity',
    'Numoeba',
    'Telescope',
  ]),
  ICPCRegional2001: official([
    'Starship Hakodate-maru',
    'e-market',
    'Fishnet',
    '77377',
    'Beehives',
    'Young, Poor and Busy',
    'Nim',
    'Super Star',
  ]),
  ICPCRegional2002: official([
    'Calling Extraterrestrial Intelligence Again',
    'Equals are Equals',
    'GIGA Universe Cup',
    'Life Line',
    'Map of Ninja House',
    'Shredding Company',
    'True Liars',
    'Viva Confetti',
  ]),
  ICPCRegional2003: official([
    'Unreliable Message',
    "Lagrange's Four-Square Theorem",
    'Area of Polygons',
    'Weather Forecast',
    'Molecular Formula',
    'Gap',
    'Concert Hall Scheduling',
    'Monster Trap',
  ]),
  ICPCRegional2004: official([
    'The Balance',
    'Make a Sequence',
    'Leaky Cryptography',
    'Pathological Paths',
    'Confusing Login Names',
    'Dice Puzzle',
    'Color the Map',
    'Inherit the Spheres',
    'Crossing Prisms',
  ]),
  ICPCRegional2005: official([
    'Sum of Consecutive prime Numbers',
    'Book Replacement',
    'Colored Cubes',
    'Organize Your Train',
    'Mobile Computing',
    'Atomic Car Race',
    'Network Mess',
    'Bingo',
    'Shy Polygons',
  ]),
  ICPCRegional2006: official([
    'How I Wonder What You Are!',
    'How I Mathematician Wonder What You Are!',
    'Cubic Eight-Puzzle',
    'Sum of Different Primes',
    'Manhattan Wiring',
    'Power Calculus',
    'Polygons on the Grid',
    'The Best Name for Your Baby',
    'Enjoyable Commutation',
  ]),
  ICPCRegional2007: official([
    'And Then There Was One',
    'Prime Gap',
    'Minimal Backgammon',
    'Lowest Pyramid',
    'Geometric Map',
    'Slim Span',
    'The Morning after Halloween',
    'Bug Hunt',
    'Most Distant Point from the Sea',
    "The Teacher's Side of Math",
  ]),
  ICPCRegional2008: official([
    'Grey Area',
    'Expected Allowance',
    'Stopped Watches',
    'Digits on the Floor',
    'Spherical Mirrors',
    'Traveling Cube',
    'Search of Concatenated Strings',
    'Top Spinning',
    'Common Polynomial',
    'Zigzag',
  ]),
  ICPCRegional2009: official([
    'Cubist Artwork',
    'Repeated Substitution with Sed',
    'Swimming Jam',
    'Separate Points',
    'Origami Through-Hole',
    "Chemist's Math",
    'Malfatti Circles',
    'Twenty Questions',
    'Hobby on Rails',
    'Infected Land',
  ]),
  ICPCRegional2010: official([
    'Membership Management',
    'Balloon Collecting',
    'Towns along a Highway',
    'Awkward Lights',
    'The Two Men of the Japanese Alps',
    'Find the Multiples',
    'Test Case Tweaking',
    "Where's Wally",
    'Intersection of Two Prisms',
    'Matrix Calculator',
  ]),
  ICPCRegional2011: official([
    'Gift from the Goddess of Programming',
    "The Sorcerer's Donut",
    'Weaker than Planned',
    'Long Distance Taxi',
    'Driving an Icosahedral Rover',
    'City Merger',
    "Captain Q's Treasure",
    'ASCII Expression',
    'Encircling Circles',
    'Round Trip',
  ]),
  ICPCRegional2012: official([
    'Ginkgo Numbers',
    'Stylish',
    'One-Dimensional Cellular Automaton',
    'Find the Outlier',
    'Sliding Block Puzzle',
    'Never Wait for Weights',
    'Let There Be Light',
    'Company Organization',
    'Beautiful Spacing',
    'Cubic Colonies',
  ]),
  ICPCRegional2013: official([
    'Equal Sum Sets',
    'The Last Ant',
    'Count the Regions',
    'Clock Hands',
    "Dragon's Cruller",
    'Directional Resemblance',
    'Longest Chain',
    "Don't Burst the Balloon",
    'Hidden Tree',
    'C(O|W|A*RD*|S)* CROSSWORD Puzzle',
  ]),
  ICPCRegional2014: official([
    'Bit String Reordering',
    'Miscalculation',
    'Shopping',
    'Space Golf',
    'Automotive Navigation',
    'There is No Alternative',
    'Flipping Parentheses',
    'Cornering at Poles',
    'Sweet War',
    'Exhibition',
    'L Jumps',
  ]),
  ICPCRegional2015: official([
    'Decimal Sequences',
    'Squeeze the Cylinders',
    'Sibling Rivalry',
    'Wall Clocks',
    'Bringing Order to Disorder',
    'Deadlock Detection',
    'Do Geese See God?',
    'Rotating Cutter Bits',
    'Routing a Marathon Race',
    'Post Office Investigation',
    'Min-Max Distance Game',
  ]),
  ICPCRegional2016: official([
    'Rearranging a Sequence',
    'Quality of Check Digits',
    'Distribution Center',
    'Hidden Anagrams',
    'Infallibly Crack Perplexing Cryptarithm',
    'Three Kingdoms of Bourdelot',
    'Placing Medals on a Binary Tree',
    'Animal Companion in Maze',
    'Skinny Polygon',
    'Cover the Polygon with Your Disk',
    'Black and White Boxes',
  ]),
  ICPCRegional2017: official([
    'Secret of Chocolate Poles',
    'Parallel Lines',
    'Medical Checkup',
    'Making Perimeter of the Convex Hull Shortes…',
    'Black or White',
    'Pizza Delivery',
    'Rendezvous on a Tetrahedron',
    'Homework',
    'Starting a Scenic Railroad Service',
    'String Puzzle',
    'Counting Cycles',
  ]),
  ICPCRegional2018: official([
    'Digits Are Not Just Characters',
    'Arithmetic Progressions',
    'Emergency Evacuation',
    'Shortest Common Non-Subsequence',
    'Eulerian Flight Tour',
    'Fair Chocolate-Cutting',
    'What Goes Up Must Come Down',
    'Four-Coloring',
    'Ranks',
    'Colorful Tree',
    'Sixth Sense',
  ]),
  ICPCRegional2019: official([
    'Fast Forwarding',
    'Estimating the Flood Risk',
    'Wall Painting',
    'Twin Trees Bros.',
    'Reordering the Documents',
    'Halting Problem',
    'Ambiguous Encoding',
    'Parentheses Editor',
    'One-Way Conveyors',
    'Fun Region',
    'Draw in Straight Lines',
  ]),
  ICPCRegional2020: official([
    'Three-Axis Views',
    'Secrets of Legendary Treasure',
    'Short Coding',
    'Colorful Rectangle',
    'Jewelry Size',
    'Solar Car',
    'To be Connected or not to be that is the Que…',
    'LCM of GCDs',
    'High-Tech Detective',
    'Formica Sokobanica',
    'Suffixes may Contain Prefixes',
  ]),
  ICPCRegional2021: official([
    'Loop of Chocolate',
    'Lottery Fun Time',
    'Reversible Compressio',
    'Wireless Communication Network',
    'Planning Railroad Discontinuation',
    "It's Surely Complex",
    'Genealogy of Puppets',
    'Cancer DNA',
    'Even Division',
    'The Cross Covers Everything',
    'Distributing the Treasure',
  ]),
  ICPCRegional2022: official([
    'Hasty Santa Claus',
    'Interactive Number Guessing',
    'Secure the Top Secret',
    'Move One Coin',
    'Incredibly Cute Penguin Chicks',
    'Make a Loop',
    'Remodeling the Dungeon',
    'Cake Decoration',
    'Quiz Contest',
    'Traveling Salesperson in an Island',
    'New Year Festival',
  ]),
  ICPCRegional2023: official([
    'Yokohama Phenomena',
    'Rank Promotion',
    'Ferris Wheel',
    'Nested Repetition Compression',
    'Chayas',
    'Color Inversion on a Huge Chessboard',
    'Fortune Telling',
    'Task Assignment to Two Employees',
    'Liquid Distribution',
    'Do It Yourself?',
    'Probing the Disk',
  ]),
  ICPCRegional2024: official([
    'Ribbon on the Christmas Present',
    'The Sparsest Number in Between',
    'Omnes Viae Yokohamam Ducunt?',
    'Tree Generators',
    'E-Circuit Is Now on Sale!',
    'The Farthest Point',
    'Beyond the Former Explorer',
    'Remodeling the Dungeon 2',
    'Greatest of the Greatest Common Divisors',
    'Mixing Solutions',
    'Scheduling Two Meetings',
    'Peculiar Protocol',
  ]),
  JAGPrelim2005: official([
    'Keitai Message',
    'Make Purse Light',
    'Dragon Fantasy',
    'Area Separation',
    'Poor Mail Forwarding',
    'Gather the Maps!',
  ]),
  JAGPrelim2006: official([
    'Misterious Gems',
    'Amida, the City of Miracle',
    'X-Ray Screening System',
    'Railroad Conflict',
    'Data Center on Fire',
    'Water Pipe Construction',
  ]),
  JAGPrelim2007: official([
    'Space Coconut Grab',
    'Osaki',
    'Surrounding Area',
    'Square Route',
    'Lifeguard in the Pool',
    'Karakuri Doll',
  ]),
  JAGPrelim2008: official([
    "Princess's Gamble",
    "Princess's Marriage",
    "Princess's Japanese",
    'Princess in Danger',
    'Princess, a Cryptanalyst',
    'Princess, a Strategist',
  ]),
  JAGPrelim2009: official([
    'Luck Manipulator',
    'Matsuzaki Number',
    'Brave Princess Revisited',
    'Restrictive Filesystem',
    'Mirror Cave',
    'Shore Erosion',
  ]),
  JAGPrelim2010: official([
    'Sum of Consecutive Integers',
    'Moonlight Farm',
    'Differential Pulse Code Modulation',
    'Mr. Rito Post Office',
    'Immortal Jewels',
    'Canal: Water Going Up and Down',
    'Magical Island 2',
  ]),
  JAGPrelim2011: official([
    'koukyoukoukokukikou',
    'Brave Force Story',
    'Fastest Route',
    '6/2(1+2)',
    'Divide the Cake',
    'Sakura Poetry',
    'Intelligent Circular Perfect Cleaner',
  ]),
  JAGPrelim2012: official([
    'Save Your Privacy!',
    'You Are the Judge',
    'Equation',
    'Milky Way',
    'The Enemy of My Enemy is My Friend',
    'Dog Food',
    'Sister Ports',
  ]),
  JAGPrelim2013: official([
    "King's Inspection",
    'Sim Forest 2013',
    'Twin book report',
    'Sinking islands',
    "Ononokomachi's Edit War",
    "Princess Tetra's Puzzle",
    'MirrorLabyrinth',
  ]),
  JAGPrelim2014: official([
    'Step Aerobics',
    'JAG-channel',
    'Broken Cipher Generator',
    '1 Day Passport',
    'Wish upon a shooting star',
    'Elevator Hall Number',
    'Golf',
  ]),
  JAGPrelim2015: official([
    'Koto Municipal Subway',
    'Airport Codes',
    'Falling Block Puzzle',
    'Alternate Escape',
    'Dice Stamp',
    'Stamp Rally',
    'Kuru Kuru Door',
  ]),
  JAGPrelim2016A: official([
    'A-un Breathing',
    'Delivery to a Luxurious House',
    'Rooted Tree for Misawa-san',
    'Invisible',
    'Campaign',
    'Land Inheritance',
    'Rings and Strings',
  ]),
  JAGPrelim2016B: official([
    'Curry Making',
    'jfen',
    'Curtain',
    'Early Morning Work at Summer Camp',
    'The Most Powerful Bed',
    'Hyakunin Isshu',
    'Baseball',
  ]),
  JAGPrelim2017: official([
    'JAG Practice Contest',
    'Coastline',
    'Quiz',
    'Game Balance',
    'Industrial Convex Pillar City',
    'Matryoshka Doll',
    'Room Assignment',
    'Big Maze',
  ]),
  JAGPrelim2018: official([
    'Change of the Era Name',
    'Generalized Leap Years',
    'Proof of Knowledge',
    'Tanka Number',
    'Divide and Conquer',
    'Antiaircraft Shield',
    'Casino',
    'NINJA GAME',
  ]),
  JAGPrelim2019: official([
    'Equal Split',
    'Poison Swamp',
    'You Should Avoid',
    'String Magic',
    'Great Strategy for Bring Up Grade',
    'The Genome Database of All Space Life Returns',
    'K is Key of Takakkey',
    'Misterious Buttons',
  ]),
  JAGPrelim2020: official([
    'nm Calculations',
    'Chains of Explosions',
    'Sneaking',
    'Almost Balanced Parentheses',
    'Edamame Energy Engineering',
    'Arrow Dice',
    'Kyopro is Useful for Asteroid Exploration',
    'Edge or Vertex',
  ]),
  JAGPrelim2021: official([
    'Tokyo2020',
    'Food Delivery',
    'Moving',
    'Buri Shabu Shaburi Club',
    'Rotation',
    'One is Zero, Zero is One',
    'Cookie Game',
    'Skewering',
  ]),
  JAGPrelim2022: official([
    'Serial Number',
    'Maximizing Pocket Money',
    'i18n',
    'Moving Point P and Funny Friends Q, R',
    'Greatest Common Divisor',
    'Nth Floor Dungeon and K Brave Men',
    'Traveling Brave Problem',
    'Parade',
  ]),
  JAGPrelim2023: official([
    'Sorting Crayons',
    'Everyday is Holiday',
    'Game',
    'IPvK',
    'Watch the Marathon',
    'Frog in a Well',
    'Watch the Movie',
    'Orienteering',
  ]),
  JAGPrelim2024: official([
    'Transition of Club Members',
    'Simple Editor',
    'Advertisement in Star Cluster',
    'Sharing Past Problems',
    'Roller Coaster 2',
    'Synthesis of Slimes',
    'Segmentation of a Sequence',
    'Physics Experiment',
    'Bridge Construction Plan 2',
  ]),
  JAGPrelim2025: official([
    'Mex Prize',
    'Flight Planning',
    'Today is the contest',
    'Guess the parentheses',
    'if-then-else',
    'Anti-BCC',
    "Hanako's Art",
    'Product of Permutations',
    "Let's Make the Best Cake",
  ]),
  JAGPrelim2026: official([
    'Booby Prize',
    'Rearrange',
    'Loooong Vacation',
    'Box Tower',
    'Secret Numbers and the Greatest Common Divisor',
    'ICPC is a Contest',
    'XOR Travel Plans',
    'Stone-Picking Game',
    "Let's Build an Evil Robot Army",
  ]),
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

function toPosition(letter: string): number {
  return letter.charCodeAt(0) - 65;
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

function verifyContest(contestId: string, problems: Problem[]): string[] {
  const officialContest = OFFICIAL_CONTESTS[contestId];

  if (officialContest === undefined) {
    return [`${contestId}: not in the official list`];
  }

  const { titles, absentLetters } = officialContest;
  const presentCount = titles.length - absentLetters.length;
  const errors: string[] = [];

  // A gap before the last AOJ problem shifts the basic rule, so such contests need a manual map.
  if (absentLetters.some((letter) => toPosition(letter) < presentCount)) {
    errors.push(
      `${contestId}: a problem before the last one is absent from prisma/tasks.ts; map letters by hand`,
    );
  }

  if (problems.length !== presentCount) {
    errors.push(`${contestId}: AOJ has ${problems.length} problems, expected ${presentCount}`);
  }

  problems.forEach((problem, position) => {
    const officialTitle = titles[position];

    if (officialTitle === undefined || !matchesTitle(problem.name, officialTitle)) {
      errors.push(
        `${contestId} ${toLetter(position)}: AOJ has "${problem.name}", expected "${officialTitle ?? '(none)'}"`,
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
  const absentContests = Object.entries(OFFICIAL_CONTESTS).filter(
    ([, officialContest]) => officialContest.absentLetters.length > 0,
  );

  errors.push(...unknownContests.map((contestId) => `${contestId}: not in prisma/tasks.ts`));

  console.error(`Contests: ${problemsByContest.size}, tasks: ${taskCount}`);
  console.error(
    `Absent from prisma/tasks.ts: ${absentContests.map(([contestId, officialContest]) => `${contestId} ${officialContest.absentLetters.join('')}`).join(', ') || 'none'}`,
  );

  if (errors.length > 0) {
    errors.forEach((error) => console.error(`ERROR ${error}`));
    process.exitCode = 1;

    return;
  }

  console.error(`All ${taskCount} titles match the official letters`);

  const letters = Object.fromEntries(
    [...problemsByContest.values()].flatMap((problems) =>
      problems.map((problem, position) => [problem.id, toLetter(position)]),
    ),
  );

  console.log(JSON.stringify(letters, null, 2));
}

main();
