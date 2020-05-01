import { performance } from "perf_hooks";

import {
  availableMoves,
  boardFull,
  checkPositionFree,
  createBoardStr,
  createState,
  GameState,
  gameWinners,
  intelligentMove,
  Player,
} from "@lib/xAndOs";
import Command from "@root/types/Command";

import { Message, MessageReaction, NewsChannel, ReactionCollector, User } from "discord.js";

const ALLOWED_REACTIONS = [
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

const tictactoe: Command = {
  aliases: ["xo", "tictactoe", "ttt", "tic"],
  usage: "[type: x or o]",
  information: "Plays tic tac toe, the default player you play as is X. Type the number of the position to place your token.",
  async exec(client, msg, args) {
    if (msg.channel instanceof NewsChannel) return;
    if (client.currentGames.has(msg.channel.id)) return void await msg.channel.send("There is already a game in this channel!");
    client.currentGames.add(msg.channel.id);
    let minPlayer = (args[0] ?? "X").toUpperCase() as Player;
    if (minPlayer !== "O" && minPlayer !== "X") minPlayer = "X";
    const maxPlayer: Player = minPlayer === "X" ? "O" : "X";

    const state = createState();
    let inProgress = false;

    const sentMsg = await msg.channel.send(gameMsg(state, 0));

    const collector = new ReactionCollector(
      sentMsg,
      (react: MessageReaction, user: User) =>
        user.id === msg.author.id &&
        ALLOWED_REACTIONS.includes(react.emoji.name),
      {
        time: 45000,
      },
    );

    // Don't use Promise.all for this, it's faster for some reason that I have not researched.
    for (const emoji of ALLOWED_REACTIONS) setImmediate(() => sentMsg.react(emoji));
 
    collector.on("collect", async (react: MessageReaction) => {
      await react.remove();
      const reactInd = ALLOWED_REACTIONS.findIndex(e => e === react.emoji.name);

      // Probably reacted in the middle of AI ply.
      if (!checkPositionFree(reactInd, state) || inProgress) return;

      inProgress = true;

      state[reactInd] = minPlayer;


      let endTime: string;
      let movePos: number;
      if (!boardFull(state)) {
        const startTime = performance.now();
        movePos = intelligentMove(state, maxPlayer);
        endTime = (performance.now() - startTime).toFixed(2);
        state[movePos] = maxPlayer;
      }

      const [fin, winner] = gameWinners(state);
      const phase = fin && winner ? -1 : fin ? 1 : 0;
      await sentMsg.edit(gameMsg(state, phase, endTime));
      if (movePos) await delReact(sentMsg, movePos);
      inProgress = false;
      if (fin) collector.stop("Game end");
    });

    collector.on("end", async (_, reason) => {
      if (reason === "time") await sentMsg.edit(gameMsg(state, 2));
      else availableMoves(state).forEach(id => delReact(sentMsg, id));
      client.currentGames.delete(msg.channel.id);
    });
  },
};

async function delReact(msg: Message, reactInd: number): Promise<void> {
  await msg.reactions.cache.find(r => r.emoji.name === ALLOWED_REACTIONS[reactInd] && r.me).remove();
}

function gameMsg(state: GameState, phase: -1 | 0 | 1 | 2, time?: string): string {
  let msgStr = "**Tic Tac Toe";
  if (phase) {
    msgStr += phase === -1 ?
      " - You lost!" : phase === 1 ?
        " - It's a tie!" :
        "- Time's up!";
  }
  msgStr += "**";
  if (time) msgStr += `\n:stopwatch: AI took ${time}ms.`;
  msgStr += `\n\`\`\`ts\n${createBoardStr(state)}\`\`\``;
  return msgStr;
}

export default tictactoe;
