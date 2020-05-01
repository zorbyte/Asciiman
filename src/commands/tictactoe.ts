import { performance } from "perf_hooks";

import { ALLOWED_REACTIONS } from "@lib/constants";
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

import {
  Message,
  MessageReaction,
  NewsChannel,
  ReactionCollector,
  User,
} from "discord.js";

const tictactoe: Command = {
  aliases: ["xo", "ox", "tictactoe", "ttt", "tic"],
  usage: "[type: x or o]",
  information: "Plays tic tac toe, the default player you play as is X. Type the number of the position to place your token.",
  exec(client, msg, args) {
    return new Promise(async (resolve, reject) => {
      try {
        if (msg.channel instanceof NewsChannel) resolve();
        if (client.currentGames.has(msg.channel.id)) {
          await msg.channel.send("There is already a game in this channel!");
          resolve();
        }

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

        const consumed: string[] = [];

        collector.on("error", reject);

        collector.on("collect", async (react: MessageReaction) => {
          try {
            await react.remove();
            const reactInd = ALLOWED_REACTIONS.findIndex(e => e === react.emoji.name);

            // Probably reacted in the middle of AI ply.
            if (!checkPositionFree(state, reactInd) || inProgress) return;

            inProgress = true;

            state[reactInd] = minPlayer;

            let endTime: string;
            let movePos: number;
            if (!boardFull(state)) {
              const startTime = performance.now();
              movePos = intelligentMove(state, maxPlayer);
              endTime = (performance.now() - startTime).toFixed(2);
              state[movePos] = maxPlayer;
              consumed.push(ALLOWED_REACTIONS[movePos]);
            }

            const [fin, winner] = gameWinners(state);
            const phase = fin && winner ? -1 : fin ? 1 : 0;
            await sentMsg.edit(gameMsg(state, phase, endTime));
            if (typeof movePos !== "undefined") await delReact(sentMsg, movePos);
            inProgress = false;
            if (fin) collector.stop("Game end");
          } catch (err) {
            reject(err);
          }
        });

        // Don't use Promise.all for this, it's faster for some reason that I have not researched.
        for (const emoji of ALLOWED_REACTIONS) if (!consumed.includes(emoji)) await sentMsg.react(emoji);

        collector.on("end", async (_, reason) => {
          try {
            if (reason === "time") await sentMsg.edit(gameMsg(state, 2));
            availableMoves(state).forEach(id => delReact(sentMsg, id));
            client.currentGames.delete(msg.channel.id);
          } catch (err) {
            reject(err);
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  },
};

async function delReact(msg: Message, reactInd: number): Promise<void> {
  const react = msg.reactions
    .cache
    .find(r => r.emoji.name === ALLOWED_REACTIONS[reactInd] && r.me);

  if (react) await react?.remove();
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
