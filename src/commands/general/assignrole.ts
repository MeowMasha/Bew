/**
 * @file Assign role command
 * @description Gives executor a role that's set to be assignable
 */

import type { EmbedField, Message, TextChannel } from "eris";

import { Command } from "../../classes/Command";
import { itemExists } from "../../utils/itemExists";

export class AssignRoleCommand extends Command {
  description = "Gives you a role that's set to be assignable.";
  clientperms = ["manageRoles"];
  args = "[role:role]";
  aliases = ["assign", "giverole", "iam"];

  async run(msg: Message<TextChannel>, _pargs: ParsedArgs[], args: string[]) {
    const guildconfig = await this.bot.db.getGuildConfig(msg.channel.guild.id);

    // If no roles are set to be assigned
    if (!guildconfig?.assignableRoles?.length) {
      return msg.createEmbed(`📄 ${msg.locale("general.CONFIG_ASSIGNABLEROLES")}`, msg.locale("general.ASSIGN_NOTHINGSET"));
    }

    // Cleans up roles that no longer exist
    guildconfig.assignableRoles = (await itemExists(
      msg.channel.guild,
      "role",
      guildconfig.assignableRoles,
      this.bot.db,
      "assignableRoles",
    )) as string[];

    // List of assignable roles if no args given
    if (!args.length) {
      return msg.createEmbed(
        `📄 ${msg.locale("general.CONFIG_ASSIGNABLEROLES")}`,
        `${guildconfig.assignableRoles.map((role) => `\`${msg.channel.guild.roles.get(role)?.name || role}\``).join(",")}`,
      );
    }

    // Tries to add each role
    let roles = await Promise.all(
      args
        .join(" ")
        .split(/(?:\s{0,},\s{0,})|\s/)
        .map(async (arg: string) => {
          const role = this.bot.args.argtypes.role(arg, msg);
          if (!role) return { added: false, role: undefined };
          if (msg.member.roles?.includes(role.id)) return { added: false, role: role, alreadyHas: true };
          if (!guildconfig.assignableRoles?.includes(role.id)) return { added: false, role: undefined };

          try {
            // Adds the role
            await msg.member.addRole(role.id, "Self-assigned");
            return { added: true, role: role };
          } catch (err) {
            return { added: false, role: role };
          }
        }),
    );

    // Finds roles that exist in args
    roles = roles.filter((role) => role.role !== undefined);

    // If no roles were added
    if (!roles.length) return msg.createEmbed(msg.locale("global.ERROR"), msg.locale("general.ASSIGN_NOROLES"), "error");

    // If the member already has every role
    if (roles.every((r) => r.alreadyHas === true)) {
      return msg.createEmbed(msg.locale("global.ERROR"), msg.locale("global.ROLE_ALREADYHAS", { amount: roles.length }), "error");
    }

    // finds failed roles
    const failed = roles.filter((r) => r.added === false);
    const added = roles.filter((r) => r.added === true);
    const failedField: EmbedField[] = [];

    if (failed.length) {
      failedField.push({
        name: msg.locale("general.ASSIGN_FAILED"),
        value: failed.map((r) => `\`${r.role.name}\``).join(", "),
      });
    }

    // Sends added roles
    msg.channel.createMessage({
      embed: {
        title: msg.locale("global.SUCCESS"),
        description: msg.locale("general.ASSIGN_ASSIGNED", {
          amount: added.length,
          roles: added.map((a) => `\`${a.role.name}\``).join(", "),
        }),
        color: msg.convertHex("success"),
        fields: failedField,
        footer: {
          text: msg.locale("global.RAN_BY", { author: msg.tagUser(msg.author) }),
          icon_url: msg.author.dynamicAvatarURL(),
        },
      },
    });

    this.bot.emit(
      "roleAssign",
      msg.channel.guild,
      msg.author,
      null,
      null,
      added.map((a) => `${a.role.name}`),
    );
  }
}
