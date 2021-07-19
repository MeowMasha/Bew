import type { NekosLifeImage } from "../../typings/endpoints";
import type { Message, TextChannel } from "eris";
import { Command } from "../../classes/Command";
import axios from "axios";

export class YuriCommand extends Command {
  description = "Sends an ecchi/hentai yuri picture.";
  aliases = ["lewdyuri", "yurihentai"];
  cooldown = 4000;
  allowdms = true;
  nsfw = true;

  async run(msg: Message<TextChannel>) {
    const body = (await axios.get("https://nekos.life/api/v2/img/yuri").catch(() => {})) as NekosLifeImage;

    if (!body || !body.data?.url) {
      return msg.createEmbed(msg.locale("global.ERROR"), msg.locale("global.RESERROR_IMAGE"), "error");
    }

    msg.channel.createMessage({
      embed: {
        title: `🏳️‍🌈 ${msg.locale("nsfw.YURI")}`,
        color: msg.convertHex("general"),
        image: {
          url: body.data.url,
        },
        footer: {
          text: msg.locale("global.RAN_BY", {
            author: msg.tagUser(msg.author),
            poweredBy: "nekos.life",
          }),
          icon_url: msg.author.dynamicAvatarURL(),
        },
      },
    });
  }
}
