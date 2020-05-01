import { dedent, zip } from "./utils";

// In order to remain within the source path, use a require instead.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require("../../package.json");

export const ZORBYTE_ID = "451285730648653834";

export const NEW_LN_START_END = /^\n|\n$/g;

export const HANGMAN_STAGES = [
  `
    +---+
        |
        |
        |
        |
        |
  =========
  `,
  `
    +---+
    |   |
        |
        |
        |
        |
  =========
  `,
  `
    +---+
    |   |
    O   |
        |
        |
        |
  =========
  `,
  `
    +---+
    |   |
    O   |
    |   |
        |
        |
  =========
  `,
  `
    +---+
    |   |
    O   |
   /|   |
        |
        |
  =========
  `,
  `
    +---+
    |   |
    O   |
   /|\\  |
        |
        |
  =========
  `,
  `
    +---+
    |   |
    O   |
   /|\\  |
   /    |
        |
  =========
  `,
  `
    +---+
    |   |
    O   |
   /|\\  |
   / \\  |
        |
  =========
  `,
].map(str => dedent(str.replace(NEW_LN_START_END, ""), 2));

const ASCI_MAN_NAME = `
    _             _ _ __  __             
   / \\   ___  ___(_|_)  \\/  | __ _ _ __  
  / _ \\ / __|/ __| | | |\\/| |/ _\` | '_ \\ 
 / ___ \\ __ \\ (__| | | |  | | (_| | | | |
/_/   \\_\\___/\\___|_|_|_|  |_|\\__,_|_| |_|
                              v${version}
`.trimEnd();

export const ASCII_ART = zip(
  HANGMAN_STAGES[7].split("\n"),
  ASCI_MAN_NAME.split("\n"),
)
  .map(s => s.join("\t     "))
  .join("\n")
  .replace(NEW_LN_START_END, "");

export const WINNING_POSSIBILITIES = [
  // Horizontal possibilities.
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],

  // Vertical possibilities.
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],

  // Diagonal possibilities.
  [0, 4, 8],
  [2, 4, 6],
];

export const ALLOWED_REACTIONS = [
  "1⃣",
  "2⃣",
  "3⃣",
  "4⃣",
  "5⃣",
  "6⃣",
  "7⃣",
  "8⃣",
  "9⃣",
];
