import Command from "@root/types/Command";
import { HANGMAN_STAGES } from "@utils/constants";

import { Message, MessageCollector, NewsChannel } from "discord.js";

const hangman: Command = {
  aliases: ["hm"],
  usage: "[...players]",
  information: "Plays a game of hangman, optionally, define a list of players.",
  async exec(client, msg) {
    if (msg.channel instanceof NewsChannel) return;
    const randomWordInd = Math.floor(Math.random() * client.allWordsLength);
    const word = client.allWords[randomWordInd];
    const peekedWordAmnt = Math.ceil(word.length * 0.2);
    let placeholder = `${word.slice(0, peekedWordAmnt)}${"_".repeat(word.length - peekedWordAmnt)}`;

    const letters = new Set(
      word.slice(peekedWordAmnt)
        .split("")
        .filter((c, i) => i !== word.lastIndexOf(c)),
    );
    const userIds = new Set([...msg.mentions.members.values()]
      .map(member => member.id));
    
    userIds.add(msg.author.id);

    let phase = 0;
    const sentMsg = await msg.channel.send(generateGameStr(placeholder, 0, phase));

    const collector = new MessageCollector(msg.channel, (resp: Message) => userIds.has(resp.author.id), {
      max: word.length + 8,
      time: 30000,
    });

    collector.on("collect", ({ content, author }: Message) => {
      if (userIds.size !== 1) userIds.delete(author.id);
      if (content === word) {
        collector.stop("Game won");
        return sentMsg.edit(generateGameStr(word, 1, phase));
      }

      phase++;
      if (letters.has(content)) {
        const occurInds = word.split("").reduce((prev, cur, ind) => {
          if (cur === content) prev.push(ind);
          return prev;
        }, []);

        placeholder = placeholder
          .split("")
          .map((char, ind) => occurInds.includes(ind) ? content : char)
          .join("");

        const gameState = placeholder === word ? 1 : 0;

        if (gameState === 1) collector.stop("Game won");
        letters.delete(content);
        return sentMsg.edit(generateGameStr(placeholder, gameState, phase));
      } else if (phase === 7) {
        collector.stop("Game lost");
        sentMsg.edit(generateGameStr(word, -1, phase));
      } else {
        sentMsg.edit(generateGameStr(placeholder, 0, phase));
      }
    });

    collector.once("end", (_, reason) => {
      if (reason === "time") sentMsg.edit(`***Time's up! - ***${generateGameStr(word, -1, phase)}`);
    });
  },
};

// States: Lose, Playing, Win.
function generateGameStr(placeholder: string, gameState: -1 | 0 | 1, phase: number): string {
  const verb = gameState === -1 ?
    "You've lost" :
    gameState === 0 ?
      "Let's play" :
      "You've won!";
  const str = `***${verb} hangman!***\nThe word is: \`${placeholder}\`\n\`\`\`${HANGMAN_STAGES[phase]}\`\`\``;
  return str;
}

export default hangman;
