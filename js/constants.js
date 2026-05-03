/**
 * @fileoverview Application constants for ElectIQ - Election Process Education Platform.
 * Contains all static data, configuration, and content used throughout the application.
 * @module constants
 */

/* ============================================================
 * APPLICATION CONFIGURATION
 * ============================================================ */

/** @constant {Object} APP_CONFIG - Core application settings */
export const APP_CONFIG = Object.freeze({
  APP_NAME: 'ElectIQ',
  APP_VERSION: '1.0.0',
  APP_TAGLINE: 'Your Interactive Election Process Guide',
  GEMINI_MODEL: 'gemini-2.0-flash',
  GEMINI_API_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
  LOCAL_STORAGE_PREFIX: 'electiq_',
  MAX_CHAT_HISTORY: 50,
  DEBOUNCE_DELAY_MS: 300,
  THROTTLE_DELAY_MS: 150,
  ANIMATION_DURATION_MS: 400,
  TOAST_DURATION_MS: 4000,
  TYPING_INDICATOR_DELAY_MS: 800,
  MAX_INPUT_LENGTH: 1000,
  QUIZ_TIME_PER_QUESTION_S: 30,
  MIN_API_KEY_LENGTH: 20,
  HERO_ANIMATION_BASE_DELAY_MS: 200,
  HERO_ANIMATION_STAGGER_MS: 150,
  SCROLL_THRESHOLD_PX: 60,
  INTERSECTION_THRESHOLD: 0.3,
  TIMELINE_INTERSECTION_THRESHOLD: 0.2,
  TIMELINE_ROOT_MARGIN: '0px 0px -50px 0px',
  PARTICLE_COUNT: 30,
  PARTICLE_WRAP_OFFSET: 20,
  PARTICLE_MIN_SIZE: 10,
  PARTICLE_SIZE_RANGE: 14,
  PARTICLE_MIN_OPACITY: 0.1,
  PARTICLE_OPACITY_RANGE: 0.3,
  PARTICLE_VELOCITY_RANGE: 0.5,
  CHOICE_OUTCOME_DELAY_MS: 800,
  ANSWER_EXPLANATION_DELAY_MS: 2500,
  TIMER_WARNING_THRESHOLD_S: 5,
  RECENT_HISTORY_LIMIT: 10,
  GEMINI_TEMPERATURE: 0.7,
  GEMINI_TOP_K: 40,
  GEMINI_TOP_P: 0.95,
  GEMINI_MAX_OUTPUT_TOKENS: 1024,
  CHART_ANIMATION_DURATION_MS: 1000,
  FONT_SIZE_MIN: 12,
  FONT_SIZE_MAX: 24,
  FONT_SIZE_STEP: 2,
  FONT_SIZE_DEFAULT: 16,
  LEADERBOARD_DEFAULT_LIMIT: 10,
  MAPS_EMBED_API_KEY: 'AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8',
});

/** @constant {Object} ARIA_LABELS - Accessibility labels */
export const ARIA_LABELS = Object.freeze({
  MAIN_NAV: 'Main navigation',
  CHAT_INPUT: 'Type your election question',
  CHAT_SEND: 'Send message',
  CHAT_REGION: 'Chat conversation',
  TIMELINE_NAV: 'Election process timeline',
  QUIZ_REGION: 'Election knowledge quiz',
  SKIP_LINK: 'Skip to main content',
  THEME_TOGGLE: 'Toggle high contrast mode',
  CLOSE_MODAL: 'Close dialog',
});

/** @constant {Object} SECURITY - Security-related constants */
export const SECURITY = Object.freeze({
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'h3', 'h4', 'span'],
  MAX_RATE_LIMIT_REQUESTS: 10,
  RATE_LIMIT_WINDOW_MS: 60000,
  INPUT_PATTERN: /^[a-zA-Z0-9\s.,!?'"()\-:;@#%&*+=\[\]{}|/\\<>~`^_]+$/,
  CSP_ALLOWED_SCRIPT_DOMAINS: [
    "'self'",
    'https://www.gstatic.com',
    'https://translate.google.com',
    'https://translate.googleapis.com',
    'https://apis.google.com',
  ],
  CSP_ALLOWED_CONNECT_DOMAINS: [
    "'self'",
    'https://generativelanguage.googleapis.com',
    'https://firestore.googleapis.com',
    'https://www.googleapis.com',
    'https://identitytoolkit.googleapis.com',
    'https://securetoken.googleapis.com',
    'https://www.google-analytics.com',
    'https://translate.googleapis.com',
  ],
  CSP_ALLOWED_FRAME_DOMAINS: [
    'https://www.google.com',
    'https://accounts.google.com',
  ],
});

/** @constant {Object} CHART_CONFIG - Google Charts styling configuration */
export const CHART_CONFIG = Object.freeze({
  COLORS: {
    PRIMARY: '#6C63FF',
    PRIMARY_LIGHT: '#7B73FF',
    SECONDARY: '#00D4AA',
    SECONDARY_LIGHT: '#00E4BA',
    TERTIARY: '#FFB347',
    DANGER: '#FF6B8A',
    PURPLE: '#A78BFA',
    TEXT: '#E8E8FF',
    TEXT_MUTED: '#A0A0CC',
    GRID: '#1E2250',
  },
  TITLE_FONT_SIZE: 14,
  LEGEND_FONT_SIZE: 11,
  CHART_AREA_BAR: { width: '75%', height: '70%' },
  CHART_AREA_PIE: { width: '85%', height: '80%' },
  PIE_HOLE_SIZE: 0.4,
  TURNOUT_MIN_VALUE: 50,
});

/** @constant {Array<string>} PARTICLE_SYMBOLS - Symbols used in hero particle animation */
export const PARTICLE_SYMBOLS = Object.freeze(['🗳️', '✓', '⭐', '📋', '🏛️', '✦', '◆']);

/** @constant {Array<Object>} ELECTION_DATES - Election dates for Google Calendar integration */
export const ELECTION_DATES = Object.freeze([
  {
    title: 'Voter Registration Deadline',
    date: '2026-09-15',
    description: 'Last day to register or update your voter registration for the upcoming election.',
    location: 'Your Local Election Office',
  },
  {
    title: 'Early Voting Begins',
    date: '2026-10-20',
    description: 'Early voting period opens. Cast your vote before Election Day at designated centers.',
    location: 'Early Voting Centers',
  },
  {
    title: 'Election Day',
    date: '2026-11-03',
    description: 'General Election Day. Vote at your assigned polling station.',
    location: 'Your Assigned Polling Station',
  },
  {
    title: 'Results Declaration',
    date: '2026-11-10',
    description: 'Official election results are expected to be declared.',
    location: 'Election Commission Headquarters',
  },
]);

/** @constant {Object} GOOGLE_TRANSLATE_CONFIG - Configuration for Google Translate widget */
export const GOOGLE_TRANSLATE_CONFIG = Object.freeze({
  PAGE_LANGUAGE: 'en',
  INCLUDED_LANGUAGES: 'en,hi,ta,te,bn,mr,gu,kn,ml,pa,ur,es,fr,de,zh-CN,ja,ar',
  ELEMENT_ID: 'google-translate-widget',
});

/* ============================================================
 * ELECTION TIMELINE DATA
 * ============================================================ */

/** @constant {Array<Object>} ELECTION_TIMELINE - Steps of the election process */
export const ELECTION_TIMELINE = Object.freeze([
  {
    id: 1,
    title: 'Election Announcement',
    icon: '📢',
    duration: 'Day 1',
    summary: 'The Election Commission officially announces the election schedule and code of conduct.',
    details: [
      'The Election Commission sets the date for elections and publishes the official gazette notification.',
      'Model Code of Conduct comes into effect immediately, restricting government announcements.',
      'Electoral rolls are finalized and made available for public inspection.',
      'Election machinery is set in motion across all constituencies.',
    ],
    keyFact: 'The Model Code of Conduct ensures a level playing field for all parties during elections.',
  },
  {
    id: 2,
    title: 'Voter Registration',
    icon: '📝',
    duration: 'Ongoing',
    summary: 'Eligible citizens register themselves on the electoral roll to participate in voting.',
    details: [
      'Citizens who are 18 years or older on the qualifying date can register as voters.',
      'Registration can be done online through the official election portal or at designated centers.',
      'Voter ID cards (EPIC) are issued to registered voters as proof of identity.',
      'Special drives are conducted to register first-time voters and update existing records.',
    ],
    keyFact: 'In many democracies, you can check and update your voter registration status online.',
  },
  {
    id: 3,
    title: 'Candidate Nomination',
    icon: '🏛️',
    duration: 'Week 2-3',
    summary: 'Aspiring candidates file their nomination papers with the returning officer.',
    details: [
      'Candidates must file nomination papers along with a security deposit.',
      'Each nomination must be supported by a minimum number of registered voters.',
      'Candidates must declare their criminal record, assets, and educational qualifications.',
      'Scrutiny of nominations is conducted to verify eligibility of all candidates.',
    ],
    keyFact: 'Transparency in candidate declarations helps voters make informed choices.',
  },
  {
    id: 4,
    title: 'Campaign Period',
    icon: '📣',
    duration: 'Week 3-6',
    summary: 'Political parties and candidates campaign to win voter support through rallies and media.',
    details: [
      'Parties release their election manifestos outlining promises and policy positions.',
      'Candidates conduct rallies, door-to-door campaigns, and media outreach.',
      'Spending limits are enforced, and all expenses must be documented and reported.',
      'Campaigning must stop 48 hours before polling begins (silence period).',
    ],
    keyFact: 'Campaign spending limits exist to prevent wealthy candidates from having an unfair advantage.',
  },
  {
    id: 5,
    title: 'Voter Education',
    icon: '📚',
    duration: 'Continuous',
    summary: 'Authorities conduct awareness programs to educate voters about the process and their rights.',
    details: [
      'SVEEP (Systematic Voters Education and Electoral Participation) programs are conducted.',
      'Mock polling exercises help first-time voters understand the voting process.',
      'Information about polling station locations, timings, and required documents is disseminated.',
      'Special outreach for marginalized communities, persons with disabilities, and remote areas.',
    ],
    keyFact: 'Voter education programs have significantly increased turnout in underrepresented communities.',
  },
  {
    id: 6,
    title: 'Polling Day Setup',
    icon: '🏗️',
    duration: 'Day Before Polling',
    summary: 'Election officials prepare polling stations with equipment, security, and accessibility measures.',
    details: [
      'Electronic Voting Machines (EVMs) and VVPAT units are tested and sealed.',
      'Polling stations are set up with proper signage, lighting, and accessibility ramps.',
      'Security personnel are deployed to maintain law and order around polling stations.',
      'Presiding officers and polling agents receive final briefings and materials.',
    ],
    keyFact: 'Every polling station must be within 2 km of voters to ensure maximum accessibility.',
  },
  {
    id: 7,
    title: 'Casting Your Vote',
    icon: '🗳️',
    duration: 'Polling Day',
    summary: 'Registered voters visit polling stations to cast their votes through secret ballot.',
    details: [
      'Voters must carry valid photo ID to the polling station for verification.',
      'Indelible ink is applied to prevent duplicate voting.',
      'Votes are cast using Electronic Voting Machines (EVMs) in a private booth.',
      'VVPAT slips allow voters to verify their vote was recorded correctly.',
    ],
    keyFact: 'The secret ballot principle ensures that no one can know how you voted, protecting your freedom.',
  },
  {
    id: 8,
    title: 'Vote Counting',
    icon: '🔢',
    duration: 'Counting Day',
    summary: 'Sealed EVMs are opened and votes are counted under strict supervision of observers.',
    details: [
      'EVMs are transported from polling stations to counting centers under armed escort.',
      'Counting agents from each party observe the entire counting process.',
      'Postal ballots are counted first, followed by EVM votes round by round.',
      'VVPAT verification is conducted for randomly selected polling stations.',
    ],
    keyFact: 'Multiple layers of verification ensure the integrity and accuracy of vote counting.',
  },
  {
    id: 9,
    title: 'Results Declaration',
    icon: '🏆',
    duration: 'Results Day',
    summary: 'Official results are announced and winning candidates receive certificates of election.',
    details: [
      'Results are declared constituency by constituency as counting is completed.',
      'The candidate with the most votes in each constituency is declared the winner.',
      'Official results are published on the Election Commission website in real-time.',
      'Candidates can challenge results through an election petition in court.',
    ],
    keyFact: 'Real-time result tracking has made elections more transparent than ever before.',
  },
  {
    id: 10,
    title: 'Government Formation',
    icon: '⚖️',
    duration: 'Post-Results',
    summary: 'The party or coalition with majority forms the government and takes oath of office.',
    details: [
      'The party/coalition with a majority of seats is invited to form the government.',
      'The leader of the majority party is appointed as the head of government.',
      'Cabinet ministers are selected and sworn into their respective offices.',
      'The new government presents its agenda and begins governance.',
    ],
    keyFact: 'Coalition governments bring diverse perspectives but require consensus-building.',
  },
]);

/* ============================================================
 * QUIZ DATA
 * ============================================================ */

/** @constant {Array<Object>} QUIZ_QUESTIONS - Election knowledge quiz questions */
export const QUIZ_QUESTIONS = Object.freeze([
  {
    id: 'q1',
    question: 'What is the minimum voting age in most democracies around the world?',
    options: ['16 years', '18 years', '21 years', '25 years'],
    correct: 1,
    explanation: 'The minimum voting age is 18 years in most democratic countries worldwide.',
    difficulty: 'easy',
    category: 'Basics',
  },
  {
    id: 'q2',
    question: 'What is the primary purpose of the Model Code of Conduct?',
    options: [
      'To increase voter turnout',
      'To ensure fair elections and level playing field',
      'To reduce election costs',
      'To speed up the counting process',
    ],
    correct: 1,
    explanation: 'The Model Code of Conduct ensures all parties compete on a level playing field during elections.',
    difficulty: 'medium',
    category: 'Rules',
  },
  {
    id: 'q3',
    question: 'What does EVM stand for in the context of elections?',
    options: [
      'Electronic Verification Machine',
      'Electoral Vote Manager',
      'Electronic Voting Machine',
      'Election Validation Mechanism',
    ],
    correct: 2,
    explanation: 'EVM stands for Electronic Voting Machine, used to cast and record votes electronically.',
    difficulty: 'easy',
    category: 'Technology',
  },
  {
    id: 'q4',
    question: 'Why is indelible ink applied to a voter\'s finger?',
    options: [
      'For identification purposes',
      'To prevent duplicate voting',
      'As a tradition',
      'For health screening',
    ],
    correct: 1,
    explanation: 'Indelible ink prevents a person from voting more than once in the same election.',
    difficulty: 'easy',
    category: 'Process',
  },
  {
    id: 'q5',
    question: 'What is the "silence period" before an election?',
    options: [
      'When media cannot report on elections',
      'When courts cannot hear election cases',
      'When campaigning must stop (typically 48 hours before polling)',
      'When voters must not discuss politics',
    ],
    correct: 2,
    explanation: 'The silence period (usually 48 hours before polling) prohibits campaigning to let voters decide freely.',
    difficulty: 'medium',
    category: 'Rules',
  },
  {
    id: 'q6',
    question: 'What does VVPAT stand for?',
    options: [
      'Voter Verified Paper Audit Trail',
      'Valid Vote Processing And Tracking',
      'Verified Voting Process Authentication Tool',
      'Vote Validation Paper Assessment Technology',
    ],
    correct: 0,
    explanation: 'VVPAT (Voter Verified Paper Audit Trail) lets voters verify their vote was recorded correctly.',
    difficulty: 'hard',
    category: 'Technology',
  },
  {
    id: 'q7',
    question: 'What is gerrymandering?',
    options: [
      'A type of voting fraud',
      'Manipulating electoral district boundaries for political advantage',
      'A campaign strategy',
      'The process of recounting votes',
    ],
    correct: 1,
    explanation: 'Gerrymandering is the manipulation of electoral boundaries to favor a particular party.',
    difficulty: 'hard',
    category: 'Concepts',
  },
  {
    id: 'q8',
    question: 'What is universal suffrage?',
    options: [
      'Right to free speech during elections',
      'Right of all adult citizens to vote regardless of background',
      'Freedom to form political parties',
      'Right to stand as a candidate',
    ],
    correct: 1,
    explanation: 'Universal suffrage means all adult citizens have the right to vote regardless of race, gender, or wealth.',
    difficulty: 'medium',
    category: 'Concepts',
  },
  {
    id: 'q9',
    question: 'What is a by-election?',
    options: [
      'An election held every 5 years',
      'A local council election',
      'An election held to fill a vacancy between general elections',
      'A preliminary round of voting',
    ],
    correct: 2,
    explanation: 'A by-election fills a vacancy caused by death, resignation, or disqualification of an elected member.',
    difficulty: 'medium',
    category: 'Concepts',
  },
  {
    id: 'q10',
    question: 'What is the First Past The Post (FPTP) system?',
    options: [
      'Candidates must win more than 50% of votes',
      'The candidate with the most votes wins, no majority needed',
      'Voters rank candidates in order of preference',
      'Seats are allocated proportionally to vote share',
    ],
    correct: 1,
    explanation: 'In FPTP, the candidate with the most votes wins the seat, even without an absolute majority.',
    difficulty: 'hard',
    category: 'Systems',
  },
  {
    id: 'q11',
    question: 'What is the purpose of exit polls?',
    options: [
      'To predict winners before official counting',
      'To verify the accuracy of EVMs',
      'To determine voter satisfaction',
      'To check for electoral fraud',
    ],
    correct: 0,
    explanation: 'Exit polls survey voters after they vote to predict election outcomes before official results.',
    difficulty: 'easy',
    category: 'Process',
  },
  {
    id: 'q12',
    question: 'What is a coalition government?',
    options: [
      'A government run by the military',
      'A government formed by two or more parties together',
      'A government with no opposition',
      'A temporary government during elections',
    ],
    correct: 1,
    explanation: 'A coalition government is formed when no single party has a majority and multiple parties join together.',
    difficulty: 'medium',
    category: 'Concepts',
  },
  {
    id: 'q13',
    question: 'Why is the secret ballot important in elections?',
    options: [
      'It speeds up the counting process',
      'It reduces the cost of elections',
      'It protects voters from pressure and intimidation',
      'It prevents candidates from knowing their vote count',
    ],
    correct: 2,
    explanation: 'The secret ballot ensures voters can vote freely without fear of retaliation or coercion.',
    difficulty: 'easy',
    category: 'Basics',
  },
  {
    id: 'q14',
    question: 'What is proportional representation?',
    options: [
      'Each district elects one representative',
      'Seats are allocated based on the proportion of votes each party receives',
      'Representatives are appointed by the government',
      'Voters can vote for multiple candidates',
    ],
    correct: 1,
    explanation: 'Proportional representation allocates seats based on the percentage of votes each party receives.',
    difficulty: 'hard',
    category: 'Systems',
  },
  {
    id: 'q15',
    question: 'What is the role of election observers?',
    options: [
      'To campaign for candidates',
      'To count the votes',
      'To monitor the election process for fairness and transparency',
      'To register voters',
    ],
    correct: 2,
    explanation: 'Election observers independently monitor elections to ensure they are conducted fairly and transparently.',
    difficulty: 'medium',
    category: 'Process',
  },
]);

/* ============================================================
 * SIMULATOR SCENARIOS
 * ============================================================ */

/** @constant {Object} SIMULATOR_ROLES - Available simulation roles */
export const SIMULATOR_ROLES = Object.freeze({
  voter: {
    id: 'voter',
    title: 'The Voter',
    icon: '🗳️',
    description: 'Experience the election journey as a citizen exercising your democratic right.',
    color: '#6C63FF',
  },
  candidate: {
    id: 'candidate',
    title: 'The Candidate',
    icon: '🎤',
    description: 'Step into the shoes of a candidate running for elected office.',
    color: '#00D4AA',
  },
  officer: {
    id: 'officer',
    title: 'The Election Officer',
    icon: '📋',
    description: 'Manage the election process and ensure everything runs smoothly.',
    color: '#FFB347',
  },
});

/** @constant {Object} SIMULATOR_SCENARIOS - Branching scenarios for each role */
export const SIMULATOR_SCENARIOS = Object.freeze({
  voter: [
    {
      step: 1,
      title: 'Registration Check',
      narrative: 'Election day is approaching. You need to make sure you are registered to vote. What do you do?',
      choices: [
        {
          text: 'Check my registration online through the official portal',
          outcome: 'Smart move! You verify your details and find your polling station location.',
          points: 10,
          isOptimal: true,
        },
        {
          text: 'Assume I am already registered from last time',
          outcome: 'Risky! Electoral rolls get updated. You might miss the deadline if there are issues.',
          points: 3,
          isOptimal: false,
        },
      ],
    },
    {
      step: 2,
      title: 'Research Candidates',
      narrative: 'Several candidates are contesting from your constituency. How do you learn about them?',
      choices: [
        {
          text: 'Read their official manifestos, check their track record, and watch debates',
          outcome: 'Excellent! Comprehensive research helps you make an informed decision.',
          points: 10,
          isOptimal: true,
        },
        {
          text: 'Follow social media posts and campaign ads only',
          outcome: 'Be careful! Campaign ads may be biased. Cross-referencing multiple sources is important.',
          points: 5,
          isOptimal: false,
        },
      ],
    },
    {
      step: 3,
      title: 'Polling Day',
      narrative: 'It\'s polling day! You arrive at your designated polling station. What should you carry?',
      choices: [
        {
          text: 'Valid photo ID (Voter ID/Passport/Driving License) as required',
          outcome: 'Perfect! You are verified quickly and proceed to the voting booth.',
          points: 10,
          isOptimal: true,
        },
        {
          text: 'Just my phone with a screenshot of my voter registration',
          outcome: 'A screenshot may not be accepted. Always carry original valid photo identification.',
          points: 2,
          isOptimal: false,
        },
      ],
    },
    {
      step: 4,
      title: 'Casting Your Vote',
      narrative: 'You are in the voting booth with the EVM. How do you ensure your vote counts?',
      choices: [
        {
          text: 'Press the button next to my chosen candidate and verify on the VVPAT slip',
          outcome: 'Well done! You verified your vote was correctly recorded. Democracy in action!',
          points: 10,
          isOptimal: true,
        },
        {
          text: 'Press the button quickly and leave without checking anything',
          outcome: 'Always verify your VVPAT slip to ensure your vote was recorded for the right candidate.',
          points: 5,
          isOptimal: false,
        },
      ],
    },
  ],
  candidate: [
    {
      step: 1,
      title: 'Filing Nomination',
      narrative: 'You have decided to contest elections. What is your first step?',
      choices: [
        {
          text: 'File nomination with all required documents, affidavit, and security deposit',
          outcome: 'Your nomination is accepted after scrutiny. Your candidature is official!',
          points: 10,
          isOptimal: true,
        },
        {
          text: 'Announce candidacy on social media first',
          outcome: 'Social media buzz is good, but without official filing, you cannot be on the ballot.',
          points: 3,
          isOptimal: false,
        },
      ],
    },
    {
      step: 2,
      title: 'Campaign Strategy',
      narrative: 'You need to reach voters across your constituency. How do you campaign?',
      choices: [
        {
          text: 'Balanced approach: town halls, door-to-door, social media, and print materials within spending limits',
          outcome: 'Great strategy! You reach diverse voter groups while staying within legal limits.',
          points: 10,
          isOptimal: true,
        },
        {
          text: 'Spend heavily on TV ads and large rallies',
          outcome: 'Watch your budget! Exceeding spending limits can lead to disqualification.',
          points: 4,
          isOptimal: false,
        },
      ],
    },
    {
      step: 3,
      title: 'Debate Preparation',
      narrative: 'A public debate has been organized with all candidates. How do you prepare?',
      choices: [
        {
          text: 'Study policy issues deeply, prepare data-backed arguments, and practice responses',
          outcome: 'Your well-researched performance impresses voters and builds credibility.',
          points: 10,
          isOptimal: true,
        },
        {
          text: 'Focus on attacking opponents rather than presenting your own plans',
          outcome: 'Negative campaigning can backfire. Voters prefer candidates with constructive solutions.',
          points: 3,
          isOptimal: false,
        },
      ],
    },
    {
      step: 4,
      title: 'Election Day & Results',
      narrative: 'Voting is complete and results are being counted. How do you handle the outcome?',
      choices: [
        {
          text: 'Accept the results gracefully, thank supporters, and congratulate the winner if not you',
          outcome: 'Your sportsmanship strengthens democratic values. Win or lose, you earned respect.',
          points: 10,
          isOptimal: true,
        },
        {
          text: 'Challenge the results immediately without evidence',
          outcome: 'Baseless challenges undermine public trust. Only challenge with documented evidence.',
          points: 2,
          isOptimal: false,
        },
      ],
    },
  ],
  officer: [
    {
      step: 1,
      title: 'Pre-Election Training',
      narrative: 'You have been appointed as a presiding officer. What do you prioritize?',
      choices: [
        {
          text: 'Complete all training modules, understand EVM operations, and review election laws',
          outcome: 'You are well-prepared to handle any situation on polling day professionally.',
          points: 10,
          isOptimal: true,
        },
        {
          text: 'Rely on experience from previous elections without refresher training',
          outcome: 'Rules and technology change. Updated training is essential for conducting fair elections.',
          points: 4,
          isOptimal: false,
        },
      ],
    },
    {
      step: 2,
      title: 'Polling Station Setup',
      narrative: 'You arrive at your polling station the day before. What do you check?',
      choices: [
        {
          text: 'Test all EVMs, verify VVPAT, check accessibility ramps, signage, and security arrangements',
          outcome: 'Everything is in order. Your thorough preparation ensures smooth operations.',
          points: 10,
          isOptimal: true,
        },
        {
          text: 'Focus only on setting up the EVMs and seating',
          outcome: 'Accessibility and signage are equally important for an inclusive election process.',
          points: 5,
          isOptimal: false,
        },
      ],
    },
    {
      step: 3,
      title: 'Handling a Dispute',
      narrative: 'A polling agent claims irregularities at your station. What do you do?',
      choices: [
        {
          text: 'Document the complaint formally, investigate following protocol, and inform the returning officer',
          outcome: 'Following due process maintains the integrity of the election and protects all parties.',
          points: 10,
          isOptimal: true,
        },
        {
          text: 'Dismiss the complaint as baseless to avoid disruption',
          outcome: 'Every complaint must be documented. Ignoring them can lead to legitimate challenges later.',
          points: 2,
          isOptimal: false,
        },
      ],
    },
    {
      step: 4,
      title: 'Post-Polling Procedures',
      narrative: 'Polling has ended. What are your duties now?',
      choices: [
        {
          text: 'Seal EVMs properly, complete all paperwork, and ensure secure transport to the counting center',
          outcome: 'Your meticulous work ensures the chain of custody is maintained. The process is secure.',
          points: 10,
          isOptimal: true,
        },
        {
          text: 'Quickly pack up and hand over to transport team',
          outcome: 'Proper sealing and documentation are critical. Any gap can compromise the entire process.',
          points: 3,
          isOptimal: false,
        },
      ],
    },
  ],
});

/** @constant {string} GEMINI_SYSTEM_PROMPT - System prompt for the AI assistant */
export const GEMINI_SYSTEM_PROMPT = `You are ElectIQ, an expert election education assistant. Your role is to help users understand democratic election processes, voting rights, and civic participation.

Guidelines:
- Provide accurate, nonpartisan information about election processes
- Explain concepts in simple, accessible language
- Cover topics like voter registration, election timelines, voting methods, and democratic principles
- Be encouraging about civic participation
- If asked about specific candidates or parties, remain neutral and redirect to process education
- Use examples from various democracies to illustrate concepts
- Format responses with clear structure using bullet points when helpful
- Keep responses concise but informative (2-3 paragraphs max)
- If unsure about specific local laws, advise users to check with their local election authority`;

/** @constant {Array<string>} SUGGESTED_QUESTIONS - Pre-built chat questions */
export const SUGGESTED_QUESTIONS = Object.freeze([
  'How does voter registration work?',
  'What happens on election day?',
  'Explain the counting process',
  'What is proportional representation?',
  'How are election results verified?',
  'What rights do voters have?',
]);

/** @constant {Object} QUIZ_GRADE_THRESHOLDS - Score thresholds for quiz grade calculation */
export const QUIZ_GRADE_THRESHOLDS = Object.freeze({
  EXPERT: 90,
  INFORMED: 70,
  LEARNING: 50,
});

/** @constant {Object} SIMULATOR_GRADE_THRESHOLDS - Score thresholds for simulator grade calculation */
export const SIMULATOR_GRADE_THRESHOLDS = Object.freeze({
  EXCELLENT: 90,
  GOOD: 70,
});

/** @constant {Object} DIFFICULTY_COLORS - Color mapping for quiz difficulty levels */
export const DIFFICULTY_COLORS = Object.freeze({
  easy: '#00D4AA',
  medium: '#FFB347',
  hard: '#FF6B6B',
});
