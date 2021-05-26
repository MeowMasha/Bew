/**
 * @file Main typings
 * @description Typings and extensions for the bot
 * @typedef index
 */

// Parsed arguments
interface ParsedArgs {
  flag: string | string[] | undefined;
  name: string;
  optional: boolean;
  type: string;
  value?: any;
}

// Fixed Eris messageReactions typing
interface MessageReactions {
  [s: string]: unknown;
  count: number;
  me: boolean;
}

// Bot log data
interface BotLogs {
  args: string[];
  authorID: string;
  cmdName: string;
  date: number;
  guildID: string;
}

// Antispam data
interface AntiSpam {
  content: string;
  date: number;
  guild: string;
  id: string;
  msgid: string;
}

// Item in validItems.ts
interface ValidItem {
  category?: string;
  default?: boolean | string | number;
  dependencies?: string[];
  emoji?: string;
  id?: keyof GuildConfig | keyof UserConfig;
  inviteFilter?: boolean;
  label?: string;
  maximum?: number;
  minimum?: number;
  name?: string;
  type?: ValidItemTypes;
}

// Valid extension events
type ExtensionEvent = "command" | "ping";

// Valid item types
type ValidItemTypes =
  | "channel"
  | "boolean"
  | "roleArray"
  | "string"
  | "channelArray"
  | "voiceChannel"
  | "number"
  | "emoji"
  | "punishment"
  | "raidPunishment"
  | "pronouns"
  | "locale"
  | "array"
  | "timezone"
  | "role"
  | "disabledCategories"
  | "disabledCmds"
  | "delete";

// Valid item category
interface ValidItemsCategory {
  emoji: string;
  id?: string;
  items: string[];
  name: string;
}
