import type { Message, TextChannel } from "eris";
import { inspect } from "util";
import { Command } from "../../classes/Command";
import axios from "axios";

export class StealEmbedCommand extends Command {
  description = "Returns a message's rich embed content.";
  args = "<message:string>";
  cooldown = 3000;

  async run(msg: Message<TextChannel>, _pargs: ParsedArgs[], args: string[]) {
    const message = await msg.channel.getMessage(args.join("")).catch(() => {});
    if (!message) return msg.createEmbed(msg.locale("global.ERROR"), msg.locale("utility.MESSAGE_NOTFOUND"), "error");

    // Gets the richembed
    const richembed = message.embeds.find((e) => e.type === "rich");
    if (!richembed) return msg.createEmbed(msg.locale("global.ERROR"), msg.locale("utility.STEALEMBED_NOEMBED"), "error");
    if (richembed.type) delete richembed.type;

    const body = await axios.post("https://pastie.io/documents", inspect(richembed)).catch(() => {});

    // If the upload failed
    if (!body || !body.data?.key) return msg.createEmbed(msg.locale("global.ERROR"), msg.locale("utility.STEALEMBED_ERROR"), "error");

    // Sends the embed object
    msg.createEmbed(
      `🔗 ${msg.locale("utility.EMBED_OBJECT")}`,
      msg.locale("utility.STEALEMBED_LINK", { url: `https://pastie.io/${body.data.key}.js` }),
    );
  }
}
