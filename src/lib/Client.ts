import Command from "@root/types/Command";

import { Client as DJSClient } from "discord.js";

class Client extends DJSClient {
  public commands = new Map<string, Command>();
  public currentGames = new Set<string>();
  public allWords!: string[];
  public allWordsLength!: number;
  public prefix!: string;
}

export default Client;
