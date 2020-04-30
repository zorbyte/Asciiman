import "module-alias/register";

import { extname, join, relative } from "path";

import Client from "@utils/Client";
import { ASCII_ART } from "@utils/constants";
import { configLoader, lookupCommand } from "@utils/utils";

import { readFile, scan } from "fs-nextra";
import ow from "ow";
import log from "signale";

import Command from "./types/Command";
import commandShape from "./types/commandShape";

const CMD_DIR = join(__dirname, "commands");

const getConfig = configLoader();

const client = new Client();

// eslint-disable-next-line no-console
console.log(ASCII_ART);

log.info(`Starting Asciiman by zorbyte.`);

client.on("ready", async () => {
  log.info("Logged into Discord.");
  const guildAmnt = client.guilds.cache.size;
  log.debug(`Logged in as ${client.user.tag} with ${guildAmnt} guild${guildAmnt === 1 ? "" : "s"}. Using prefix ${client.prefix}.`);

  await setStatus();

  log.success("Successfully bootstrapped AsciiMan.");
});

client.on("message", async msg => {
  let runningCmdName: string;

  try {
    // This is cached, so there is no lost performance here.
    const { prefix } = getConfig();

    const { content, author } = msg;
    if (author.bot || !content.startsWith(prefix)) return;

    const [cmdName, ...args] = content
      .toLowerCase()
      .slice(prefix.length)
      .trim()
      .split(/ +/g);

    const lookupRes = lookupCommand(client, cmdName);

    // Invalid command.
    if (!lookupRes) return;

    let command: Command;
    [runningCmdName, command] = lookupRes;

    log.debug(`Running command ${runningCmdName}.`);
    await command.exec(client, msg, args);
  } catch (err) {
    log.error("An error occurred on the message event.\n", err);
    if (runningCmdName) log.debug(`The command running at the time was ${runningCmdName}.`);
  }
});

client.on("shardReconnecting", async () => {
  log.debug("Client is reconnecting...");
  await setStatus();
});

client.on("warn", warning => log.error("A warning was issues by the discord.js client!", warning));
client.on("error", err => log.error("An error occurred within discord.js!", err));

bootstrap();

async function setStatus(): Promise<void> {
  await client.user.setActivity({
    name: `hangman - ${client.prefix}help`,
  });
}

async function bootstrap(): Promise<void> {
  try {
    const config = getConfig();
    log.info("Querying commands directory...");
    const files = await scan(CMD_DIR, {
      filter: (stats, path) => stats.isFile() && extname(path) === ".js",
    });
    log.success("Queried commands directory!");

    log.info("Registering commands...");
    await Promise.all([...files.keys()]
      .map(async loc => {
        const cmdName = relative(CMD_DIR, loc).slice(0, -3);

        // Commands prefixed with "_" are ignored.
        if (cmdName.startsWith("_")) return;

        const fileObj = await import(loc);
        if (!fileObj.default) log.warn(`The command ${cmdName} with no default export was provided!`);
        const cmd = fileObj.default as Command;

        // Checks if the object is a valid command.
        ow(cmd, commandShape);

        client.commands.set(cmdName, cmd);
        log.debug(`Registered command ${cmdName}.`);
      }));

    log.success("Registered all commands!");

    log.info("Loading all English words into RAM...");

    // We don't want simple words or letters of the alphabet.
    client.allWords = (await readFile(join(__dirname, "..", "static", "commonWords.txt"), {
      encoding: "utf-8",
    })).split("\n").filter(w => w.length >= config.minimumWordLength);

    // Do this now as doing it on a message is a costly operation.
    client.allWordsLength = client.allWords.length;

    log.success("Successfully loaded all English words into RAM.");

    client.prefix = config.prefix;

    log.info("Logging into Discord...");
    await client.login(config.token);
  } catch (err) {
    log.error("An error occurred while bootstrapping AsciiMan.\n", err);
    log.warn("Shutting down...");
    client.destroy();
    process.exit(1);
  }
}
