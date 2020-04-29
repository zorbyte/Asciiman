import Command from "@root/types/Command";

import { Client as DJSClient, Collection } from "discord.js";

class Client extends DJSClient {
  public commands = new Collection<string, Command>();
  public allWords!: string[];
  public allWordsLength!: number;
  public prefix!: string;
}

export default Client;
