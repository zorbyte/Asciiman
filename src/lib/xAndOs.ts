import { WINNING_POSSIBILITIES } from "./constants";

export type Player = "X" | "O";
export type PosInd = Player | number;
export type GameState = PosInd[];

export function createState(): GameState {
  return Array(9)
    .fill(void 0)
    .map((_, i) => i + 1);
}

export function checkPositionFree(posInd: number, state: GameState): boolean {
  return typeof state[posInd] === "number";
}

export function createBoardStr(state: GameState): string {
  return Array(3)
    .fill(void 0)
    .map((_, i) => `${state.slice(i * 3, (i + 1) * 3).join("|")}\n${i <= 1 ? "-----\n" : ""}`)
    .join("")
    .trimEnd();
}

export function gameWinners(state: GameState): [boolean, Player | void] {
  if (boardFull(state)) return [true, void 0];
  if (boardEmpty(state)) return [false, void 0];

  for (const path of WINNING_POSSIBILITIES) {
    const isWinner = checkPathSame(path, state);
    if (isWinner) return [true, state[path[2]] as Player];
  }

  return [false, void 0];
}

export function boardFull(state: GameState): boolean {
  return state.every(pos => typeof pos === "string");
}

function boardEmpty(state: GameState): boolean {
  return state.every(pos => typeof pos === "number");
}

function checkPathSame(path: number[], state: GameState): boolean {
  // Checks a path of the provided coordinates.
  return state[path[0]] === state[path[1]] &&
    state[path[0]] === state[path[2]] &&
    typeof state[path[0]] === "string";
}

export function availableMoves(state: GameState): number[] {
  return [...state.keys()]
    .filter(posInd => typeof state[posInd] === "number") as number[];
}

export function intelligentMove(masterState: GameState, maxPlayer: Player = "O"): number {
  const minPlayer = maxPlayer === "O" ? "X" : "O";
  const moveTree: Record<number, string> = {};

  const bestDepth = miniMax(masterState.slice());

  let bestMove = moveTree[bestDepth];
  if (bestMove.includes(",")) {
    const eqGoodMoves = bestMove.split(",");
    bestMove = eqGoodMoves[Math.floor(Math.random() * eqGoodMoves.length)];
  }

  return parseInt(bestMove);

  function miniMax(state: GameState, max = true, depth = 0, alpha = -100, beta = 100): number {
    const mainCall = depth === 0;

    // The score of this iteration.
    const [finished, winner] = gameWinners(state);
    if (finished) {
      return winner === maxPlayer ?
        100 - depth :
        winner === minPlayer ?
          depth - 100 :
          0;
    }

    let currentBest = max ? -100 : 100;
    for (const pos of availableMoves(state)) {
      const childState = state.slice();
      childState[pos] = max ? maxPlayer : minPlayer;
      const childBest = miniMax(childState, !max, depth + 1, alpha, beta);

      if (max) {
        currentBest = Math.max(currentBest, childBest);
        alpha = Math.max(currentBest, alpha);
      } else {
        currentBest = Math.min(currentBest, childBest);
        beta = Math.min(currentBest, beta);
      }

      if (alpha >= beta) break;

      if (mainCall) {
        moveTree[childBest] = childBest in moveTree ?
          `${moveTree[childBest]},${pos}` :
          pos.toString();
      }
    }

    return currentBest;
  }
}
