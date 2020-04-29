import Client from "@utils/Client";

import { Message } from "discord.js";

export type CommandExecutor = (client: Client, msg: Message, args: string[]) => Promise<void> | void;

export default interface Command {
  aliases?: string[];
  information: string;
  usage: string;
  exec: CommandExecutor;
}
