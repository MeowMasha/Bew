import type { NekobotImage } from "../../typings/endpoints";
import type { Message, TextChannel } from "eris";
import { Command } from "../../classes/Command";
import axios from "axios";

export class MidriffHentaiCommand extends Command {
  description = "Sends a ecchi/hentai midriff picture.";
  aliases = ["midriff"];
  cooldown = 4000;
  allowdms = true;
  nsfw = true;

  async run(msg: Message<TextChannel>) {
    const body = (await axios.get("https://nekobot.xyz/api/image?type=hmidriff").catch(() => {})) as NekobotImage;

    if (!body || !body.data?.message) {
      return msg.createEmbed(msg.locale("global.ERROR"), msg.locale("global.RESERROR_IMAGE"), "error");
    }

    msg.channel.createMessage({
      embed: {
        title: `🔞 ${msg.locale("nsfw.MIDRIFF_HENTAI")}`,
        color: msg.convertHex("general"),
        image: {
          url: body.data.message,
        },
        footer: {
          text: msg.locale("global.RAN_BY", {
            author: msg.tagUser(msg.author),
            poweredBy: "nekobot.xyz/api",
          }),
          icon_url: msg.author.dynamicAvatarURL(),
        },
      },
    });
  }
}
