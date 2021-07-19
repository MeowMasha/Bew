/**
 * @file Invite command
 * @description Gives links to invite the bot or get support
 */

import type { Message, TextChannel } from "eris";
import { Command } from "../../classes/Command";

export class InviteCommand extends Command {
  description = "Gives links to invite the bot or get support.";
  aliases = ["support"];
  allowdms = true;

  async run(msg: Message<TextChannel>) {
    msg.createEmbed(
      `📌 ${msg.locale("general.INVITE")}`,
      msg.locale("general.INVITE_INFO", {
        bot: `https://discord.com/oauth2/authorize?&client_id=${this.bot.user.id}&scope=bot&permissions=1581116663`,
        support: "https://discord.gg/gZEj4sM",
      }),
    );
  }
}
