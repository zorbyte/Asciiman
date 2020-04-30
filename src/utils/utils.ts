import BotConfig from "@root/types/BotConfig";
import Command from "@root/types/Command";
import configShape from "@root/types/configShape";

import ow from "ow";

import Client from "./Client";

export function dedent(target: string, indents: number): string {
  return target
    .split("\n")
    .map(s => s.slice(indents))
    .join("\n");
}

export function zip<T extends any[]>(...rows: T[]): T[][] {
  return [...rows[0]].map((_, c) => rows.map(row => row[c]));
}

export function configLoader(): () => BotConfig {
  let cachedConfig: BotConfig;

  return loadConfig;

  function loadConfig(): BotConfig {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const config = cachedConfig ?? require("../../config.json");
    if (!cachedConfig) {
      ow(config, configShape);
      cachedConfig = config;
    }

    return config;
  }
}

export type LookupResult = [string, Command];

export function lookupCommand(client: Client, cmdName: string): LookupResult | void {
  const potentialCmd = client.commands.get(cmdName);

  if (potentialCmd) return [cmdName, potentialCmd];

  const aliasCmd = [...client.commands.entries()].find(([_cName, cmd]) => cmd.aliases && cmd.aliases.includes(cmdName));

  return aliasCmd;
}
