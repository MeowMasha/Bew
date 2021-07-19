import type { NekobotImage } from "../../typings/endpoints";
import type { Message, TextChannel } from "eris";
import { Command } from "../../classes/Command";
import axios from "axios";

export class LewdNekoCommand extends Command {
  description = "Sends a NSFW image of a catgirl/neko.";
  aliases = ["catgirlhentai", "nekohentai", "lewdcatgirl"];
  cooldown = 4000;
  allowdms = true;
  nsfw = true;

  async run(msg: Message<TextChannel>) {
    const body = (await axios.get("https://nekobot.xyz/api/image?type=hneko").catch(() => {})) as NekobotImage;

    if (!body || !body.data?.message) {
      return msg.createEmbed(msg.locale("global.ERROR"), msg.locale("global.RESERROR_IMAGE"), "error");
    }

    msg.channel.createMessage({
      embed: {
        title: `🐱 ${msg.locale("nsfw.LEWDNEKO")}`,
        color: msg.convertHex("general"),
        image: {
          url: body.data.message,
        },
        footer: {
          text: msg.locale("global.RAN_BY", {
            author: msg.tagUser(msg.author),
            poweredBy: "api.nekobot.xyz",
          }),
          icon_url: msg.author.dynamicAvatarURL(),
        },
      },
    });
  }
}
