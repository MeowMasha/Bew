/*
  Logs to the main loggingchannel when added/removed from a guild.
*/

const format = require("../../lib/scripts/Format");

module.exports = (bot) => {
  // Logs when added to a server
  if (!bot.cfg.logchannel) return;
  bot.on("guildCreate", async guild => {
    // Uncached guilds
    if (typeof guild != "object" || !guild || !guild.name) return;
    const bots = guild.members.filter(m => m.bot).length;
    const owner = guild.members.get(guild.ownerID);
    bot.createMessage(bot.cfg.logchannel, {
      embed: {
        color: bot.embed.color("success"),
        author: {
          name: `Added to ${guild.name}`,
          icon_url: guild.iconURL || "https://cdn.discordapp.com/embed/avatars/0.png",
        },
        thumbnail: {
          url: guild.iconURL || "https://cdn.discordapp.com/embed/avatars/0.png",
        },
        fields: [{
          name: "ID",
          value: guild.id,
        }, {
          name: "Created",
          value: format.date(guild.createdAt),
        }, {
          name: "Owner",
          value: `${format.tag(owner, false)} (${owner.id})`,
        }, {
          name: "Members",
          value: `${guild.memberCount - bots} members, ${bots} bots`,
          inline: true,
        }, {
          name: "Region",
          value: format.region(guild.region),
          inline: true,
        }],
      },
    }).catch(() => {});
  });

  // Logs when removed from a server
  bot.on("guildDelete", async guild => {
    if (!bot.cfg.logchannel) return;
    // Uncached guilds
    if (typeof guild != "object" || !guild || !guild.name) return;
    const bots = guild.members.filter(m => m.bot).length;
    const owner = guild.members.get(guild.ownerID);
    bot.createMessage(bot.cfg.logchannel, {
      embed: {
        color: bot.embed.color("error"),
        author: {
          name: `Removed from ${guild.name}`,
          icon_url: guild.iconURL || "https://cdn.discordapp.com/embed/avatars/0.png",
        },
        thumbnail: {
          url: guild.iconURL || "https://cdn.discordapp.com/embed/avatars/0.png",
        },
        fields: [{
          name: "ID",
          value: guild.id,
        }, {
          name: "Created",
          value: format.date(guild.createdAt),
        }, {
          name: "Owner",
          value: `${format.tag(owner, false)} (${owner.id})`,
        }, {
          name: "Members",
          value: `${guild.memberCount - bots} members, ${bots} bots`,
          inline: true,
        }, {
          name: "Region",
          value: format.region(guild.region),
          inline: true,
        }],
      },
    }).catch(() => {});
  });
};