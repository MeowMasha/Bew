const Command = require("../../lib/structures/Command");
const format = require("../../lib/scripts/Format");
const hierarchy = require("../../lib/utils/Hierarchy");
const yn = require("../../lib/utils/Ask.js").YesNo;

class banCommand extends Command {
  constructor(...args) {
    super(...args, {
      args: "<member:member> [string:reason]",
      aliases: ["b"],
      description: "Bans a member from the server.",
      clientperms: "banMembers",
      requiredperms: "manageMessages",
      staff: true,
    });
  }

  async run(msg, args, pargs) {
    const user = pargs[0].value;
    let reason = args.slice(1).join(" ");
    if (!reason.length) reason = "No reason given.";
    if (reason.length > 512) reason = reason.slice(0, 512);

    // If bot doesn't have high enough role
    if (!hierarchy(msg.channel.guild.members.get(this.bot.user.id), user)) {
      return msg.channel.createMessage(this.bot.embed("❌ Error", `I don't have a high enough role to ban **${user.username}**.`, "error"));
    }

    // If author passes hierarchy
    if (hierarchy(msg.member, user)) {
      // Asks for confirmation
      const banmsg = await msg.channel.createMessage(this.bot.embed("🔨 Ban", `Are you sure you'd like to ban **${user.username}**?`));
      const response = await yn(this.bot, { author: msg.author, channel: msg.channel });
      if (!response) return banmsg.edit(this.bot.embed("🔨 Ban", `Cancelled banning **${user.username}**.`));
      // Tries to DM banned user
      const dmchannel = await user.user.getDMChannel();
      dmchannel.createMessage({
        embed: {
          title: `🚪 Banned from ${msg.channel.guild.name}`,
          description: `You were banned for \`${reason}\`.`,
          color: this.bot.embed.color("general"),
        },
      }).catch(() => {});
      // Tries to ban the user; logs
      await user.ban(1, `${reason} (by ${format.tag(msg.author, true)})`).catch(() => {});
      // Edits the banmsg
      await banmsg.edit(this.bot.embed("🔨 Ban", `**${user.username}** was banned by **${msg.author.username}**.`));
    }
  }
}

module.exports = banCommand;