import { HANGMAN_STAGES, ZORBYTE_ID } from "@lib/constants";
import Command from "@root/types/Command";

import { Message, MessageCollector, NewsChannel } from "discord.js";
import log from "signale";

let plays = 0;

const hangman: Command = {
  aliases: ["hm"],
  usage: "[...players]",
  information: "Plays a game of hangman, optionally, define a list of players.",
  async exec(client, msg) {
    // This bot does not work on NewsChannels.
    if (msg.channel instanceof NewsChannel) return;
    if (plays <= 5) plays++;

    // Fetch the participants of the game.
    const userIds = new Set(
      msg.guild ? [...msg.mentions.members.values()]
        .map(member => member.id) : [],
    );

    // Add the user who created the game to the participants.
    userIds.add(msg.author.id);

    const gameInChannel = client.currentGames.has(msg.channel.id);
    if (gameInChannel) return void await msg.channel.send("A game is already in progress in this channel!");
    client.currentGames.add(msg.channel.id);

    const rand = Math.random();

    // Get a random index.
    const randomWordInd = Math.floor(rand * client.allWordsLength);

    // Get the random word, if zorbyte#4500 is playing and this is the 5th game, and the random number is >= 5,
    // enable the easter egg word.
    const word = plays === 5 && userIds.has(ZORBYTE_ID) && rand >= 0.5 ?
      client.allWords[client.allWordsLength - 1] :
      client.allWords[randomWordInd];

    log.debug(`Hangman is being played! The word is ${word}.`);

    // Peak 35% of the word, rounded to the ceiling.
    const peekedWordAmnt = Math.ceil(word.length * 0.35);
    let placeholder = `${word.slice(0, peekedWordAmnt)}${"_".repeat(word.length - peekedWordAmnt)}`;

    const letters = new Set(
      word.slice(peekedWordAmnt)
        .split("")
        .filter((c, i) => i !== word.lastIndexOf(c)),
    );

    // The progress of hangman hanging himself.
    let phase = 0;
    const sentMsg = await msg.channel.send(generateGameStr(placeholder, 0, phase));

    // Start collecting the messages of the participants for 30 seconds.
    const collector = new MessageCollector(msg.channel, (resp: Message) => userIds.has(resp.author.id), {
      max: word.length + 8,
      time: 30000,
    });

    collector.on("collect", ({ content, author }: Message) => {
      content = content.toLowerCase();
      if (content === word) {
        collector.stop(`Game won_${author.id}`);
        return sentMsg.edit(generateGameStr(word, 1, phase));
      }

      if (letters.has(content)) {
        // The indexes that this letter occurs at.
        const occurInds = word.split("").reduce((prev, cur, ind) => {
          if (cur === content) prev.push(ind);
          return prev;
        }, []);

        // Replace the letters in the placeholer.
        placeholder = placeholder
          .split("")
          .map((char, ind) => occurInds.includes(ind) ? content : char)
          .join("");

        // Wins if the player progressivey finishes the game with letters.
        const gameState = placeholder === word ? 1 : 0;

        // If they won (1).
        if (gameState) collector.stop(`Game won_${author.id}`);

        letters.delete(content);
        return sentMsg.edit(generateGameStr(placeholder, gameState, phase));
      }

      phase++;
      
      if (phase === 7) return collector.stop("Game lost");
      sentMsg.edit(generateGameStr(placeholder, 0, phase));
    });

    collector.once("end", (_, reason) => {
      if (reason === "time") sentMsg.edit(`***Time's up! -*** ${generateGameStr(word, -1, 7)}`);
      else if (reason.startsWith("Game won")) msg.channel.send(`Congratulations <@${reason.split("_")[1]}>!`);
      else if (reason === "Game lost") sentMsg.edit(generateGameStr(word, -1, 7));
      client.currentGames.delete(msg.channel.id);
    });
  },
};

// States: Lose, Playing, Win.
function generateGameStr(placeholder: string, gameState: -1 | 0 | 1, phase: number): string {
  const verb = gameState === -1 ?
    "You've lost" :
    gameState === 0 ?
      "Let's play" :
      "You've won";
  const str = `***${verb} hangman!***\nThe word is: \`${placeholder}\`\n\`\`\`${HANGMAN_STAGES[phase]}\`\`\``;
  return str;
}

export default hangman;
