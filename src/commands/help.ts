import Command from "@root/types/Command";
import Client from "@utils/Client";
import { lookupCommand, LookupResult } from "@utils/utils";

import { EmbedField, MessageEmbed } from "discord.js";

const help: Command = {
  aliases: ["h", "man", "commands", "cmd"],
  usage: "[command]",
  information: "Displays information on how to use the bot.",
  exec(client, msg, args) {
    const embed = new MessageEmbed()
      .setTitle("Asciiman - Just a hangman bot")
      .setColor(0xFFBF00);
      
    if (args.length) {
      const cmdName = args[0].toLowerCase();
      const lookupRes = lookupCommand(client, cmdName) as LookupResult;

      // Send the default help.
      if (!lookupRes) help.exec(client, msg, []);

      const [actualName, command] = lookupRes;

      embed.addFields(buildCmdField(client, actualName, command));
    } else {
      const fields = [...client.commands.entries()].map(([name, cmd]) => buildCmdField(client, name, cmd));

      embed
        .setDescription("Asciiman is written by zorbyte#4500! It can play hangman, that's about it.")
        .addFields(fields);
    }

    msg.channel.send(embed);
  },
};

function buildCmdField(client: Client, name: string, cmd: Command): EmbedField {
  return {
    name: `\`${client.prefix}${name} ${cmd.usage}\``,
    value: `**Information:** ${cmd.information}${cmd.aliases || cmd.aliases.length ? `\n**Aliases:** ${cmd.aliases.join(", ")}` : ""}`,
    inline: false,
  };
}

export default help;
