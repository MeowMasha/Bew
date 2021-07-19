import type { Message, TextChannel } from "eris";
import { Command } from "../../classes/Command";
import { blacklistedTags, videoFileRegex } from "../../utils/constants";
import axios from "axios";

export class DanbooruCommand extends Command {
  aliases = ["db", "donmai"];
  args = "[tags:string]";
  description = "Searches for an image from Danbooru or sends a random one.";
  nsfw = true;
  cooldown = 3000;

  async run(msg: Message<TextChannel>, _pargs: ParsedArgs[], args: string[]) {
    // Danbooru only supports up to 2 tags at a time
    if (args.length > 2) return msg.createEmbed(msg.locale("global.ERROR"), msg.locale("nsfw.DANBOORU_TAGS"), "error");
    const query = encodeURIComponent(args.join(" ").toLowerCase());

    // Finds the posts
    const body = await axios.get(`https://danbooru.donmai.us/posts.json?&tags=${query}`).catch(() => {});

    // Sends if no posts
    if (!body || !body.data?.length || !body.data?.[0]?.file_url) {
      return msg.createEmbed(msg.locale("global.ERROR"), msg.locale("global.RESERROR_IMAGEQUERY"), "error");
    }

    // Gets post
    const random = Math.floor(Math.random() * body.data.length);

    // Blacklists bad posts
    if (body.data[random].rating !== "s" && !blacklistedTags.every((t) => !body.data[random]?.tag_string?.split(" ")?.includes(t))) {
      return msg.createEmbed(msg.locale("global.ERROR"), msg.locale("global.RESERROR_IMAGEQUERY"), "error");
    }

    // Handles videos
    if (videoFileRegex.test(body.data[random].file_url)) {
      return msg.createEmbed(msg.locale("global.ERROR"), msg.locale("global.RESERROR_ATTACHMENT", { url: body.data[0].file_url }), "error");
    }

    // Sends the post
    msg.channel.createMessage({
      embed: {
        title: `🔞 ${msg.locale("nsfw.DANBOORU")}`,
        color: msg.convertHex("general"),
        image: {
          url: body.data[random]?.file_url,
        },
        footer: {
          text: msg.locale("global.RAN_BY", {
            author: msg.tagUser(msg.author),
            poweredBy: "danbooru.donmai.us",
          }),
          icon_url: msg.author.dynamicAvatarURL(),
        },
      },
    });
  }
}
