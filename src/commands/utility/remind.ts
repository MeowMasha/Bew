import type { EmbedOptions, Message, TextChannel } from "eris";
import { Command } from "../../classes/Command";
import { validTimeRegex } from "../../utils/constants";
import { dateFormat } from "../../utils/format";
import { pagify } from "../../utils/pagify";
import { generateSnowflake } from "../../utils/snowflake";

export class RemindCommand extends Command {
  description = "Sends a reminder to you at a later time.";
  args = "[time:string] [reminder:string]";
  aliases = ["remindme", "reminder", "reminders"];
  cooldown = 3000;
  allowdms = true;

  async run(msg: Message<TextChannel>, _pargs: ParsedArgs[], args: string[]) {
    // Reminder list functionality
    if (!args.length || ["list", msg.locale("global.LIST")].includes(args?.[0]?.toLowerCase())) {
      const reminders = await this.bot.db.getAllUserReminders(msg.author.id);
      if (!reminders?.length) return msg.createEmbed(`⏰ ${msg.locale("utility.REMINDERS")}`, msg.locale("utility.REMINDERS_NONE"));

      // If more than 20 reminders
      if (reminders.length > 20) {
        const pages: EmbedOptions[] = [];
        reminders.forEach((r) => {
          // Makes pages out of reminders
          if (!pages[pages.length - 1] || pages[pages.length - 1].fields.length > 10) {
            pages.push({
              title: `⏰ ${msg.locale("utility.REMINDERS")}`,
              color: msg.convertHex("general"),
              fields: [
                {
                  name: `${r.id} ${r.date ? `(${dateFormat(r.date, msg.locale)})` : ""}`,
                  value: `${r.message?.slice(0, 150)}`,
                },
              ],
            });
          } else {
            // Adds to already existing pages
            pages[pages.length - 1].fields.push({
              name: `${r.id} ${r.date ? `(${dateFormat(r.date, msg.locale)})` : ""}`,
              value: `${r.message?.slice(0, 150)}`,
            });
          }
        });

        // Pagifies points
        return pagify(
          pages,
          msg.channel,
          this.bot,
          msg.author.id,
          { title: msg.locale("global.EXITED"), color: msg.convertHex("error") },
          false,
          msg.locale("global.RAN_BY", { author: msg.tagUser(msg.author), extra: "%c/%a" }),
          msg.author.dynamicAvatarURL(),
        );
      }

      return msg.channel.createMessage({
        embed: {
          title: `⏰ ${msg.locale("utility.REMINDERS")}`,
          color: msg.convertHex("general"),
          fields: reminders.map((r) => ({
            name: `${r.id} ${r.date ? `(${dateFormat(r.date, msg.locale)})` : ""}`,
            value: `${r.message}`,
          })),
          footer: {
            text: msg.locale("global.RAN_BY", { author: msg.tagUser(msg.author) }),
            icon_url: msg.author.dynamicAvatarURL(),
          },
        },
      });
    }

    // Reminder removal functionality
    if (["delete", "remove", msg.locale("global.REMOVE"), msg.locale("global.DELETE")].includes(args?.[0]?.toLowerCase())) {
      if (!args?.[1]?.length) return msg.createEmbed(msg.locale("global.ERROR"), msg.locale("global.ERROR_INVALIDID"), "error");

      // Deletes the reminder
      const reminder = await this.bot.db.deleteUserReminder(msg.author.id, args[1]);
      if (!reminder.deleted) return msg.createEmbed(msg.locale("global.ERROR"), msg.locale("utility.REMINDER_NOTFOUND"), "error");
      const foundReminder = this.bot.reminderHandler.reminders.find((reminder) => reminder.id === args[1]);
      this.bot.reminderHandler.reminders.splice(this.bot.reminderHandler.reminders.indexOf(foundReminder), 1);
      return msg.createEmbed(`⏰ ${msg.locale("utility.REMINDER")}`, msg.locale("utility.REMINDER_REMOVED"));
    }

    // Gets valid time
    let time = 0;
    const finalArgs = [...args];
    args = args.join(" ").replace(validTimeRegex, "").split(" ");

    // Parses the time given
    const timeArg = finalArgs.join(" ").substring(0, finalArgs.join(" ").indexOf(args.join(" ")));
    timeArg.split("").forEach((char: string, i: number) => {
      // Returns if it isn't a proper value
      if (isNaN(parseInt(char))) return;
      if (i === timeArg.length - 1) return;
      let value = timeArg[i + 1].toLowerCase();
      if (!isNaN(parseInt(timeArg[i + 1])) && !isNaN(parseInt(char))) return;
      if (!isNaN(parseInt(char)) && !isNaN(parseInt(timeArg[i - 1]))) char = `${timeArg[i - 1]}${char}`;
      if (timeArg[i + 2] && (value === " " || value === ",") && /[ywdhms]/.exec(timeArg[i + 2].toLowerCase())) value = timeArg[i + 2];

      // Gets exact time given
      if (isNaN(parseInt(value))) {
        switch (value) {
          case "y":
            time += parseInt(char) * 31556736000;
            break;
          case "w":
            time += parseInt(char) * 604800000;
            break;
          case "d":
            time += parseInt(char) * 86400000;
            break;
          case "h":
            time += parseInt(char) * 3600000;
            break;
          case "m":
            time += parseInt(char) * 60000;
            break;
          case "s":
            time += parseInt(char) * 1000;
            break;
        }
      }
    });

    // Gets final date and time
    if (time < 1000) return msg.createEmbed(msg.locale("global.ERROR"), msg.locale("utility.REMINDER_INVALIDTIME"), "error");
    const finalDate = new Date().getTime() + time;
    const finalTime = timeArg
      .split(" ")
      .filter((a, i) => !(a.length === 0 || (a === " " && i === args.length)))
      .join(" ");

    // Creates the reminder
    const id = generateSnowflake();
    const reminder = {
      id: id,
      date: finalDate,
      user: msg.author.id,
      message: args.join(" "),
      set: new Date(),
    };

    // Inserts the reminder and sets a timeout
    await this.bot.db.insertUserReminder(reminder);
    this.bot.reminderHandler.reminders.push(reminder);

    // Sends confirmation message
    msg.channel.createMessage({
      embed: {
        title: `⏰ ${msg.locale("utility.REMINDER_SET")}`,
        description: msg.locale("utility.REMINDER_INFO", { reminder: args.join(" "), time: finalTime }),
        color: msg.convertHex("general"),
        fields: [
          {
            name: msg.locale("global.ID"),
            value: reminder.id,
          },
          {
            name: msg.locale("global.DATE"),
            value: dateFormat(reminder.date, msg.locale),
          },
        ],
        footer: {
          text: msg.locale("global.RAN_BY", { author: msg.tagUser(msg.author) }),
          icon_url: msg.author.dynamicAvatarURL(),
        },
      },
    });
  }
}
