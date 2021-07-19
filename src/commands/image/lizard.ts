import type { NekosLifeImage } from "../../typings/endpoints";
import type { Message, TextChannel } from "eris";
import { Command } from "../../classes/Command";
import axios from "axios";

export class LizardCommand extends Command {
  aliases = ["geese"];
  description = "Sends a random picture of a goose.";
  cooldown = 3000;
  allowdms = true;

  async run(msg: Message<TextChannel>) {
    const body = (await axios.get("https://nekos.life/api/v2/img/lizard").catch(() => {})) as NekosLifeImage;

    if (!body || !body.data?.url) {
      return msg.createEmbed(msg.locale("global.ERROR"), msg.locale("global.RESERROR_IMAGE"), "error");
    }

    msg.channel.createMessage({
      embed: {
        title: `🦎 ${msg.locale("image.LIZARD")}`,
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
