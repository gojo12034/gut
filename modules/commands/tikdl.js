const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "tikdl",
  version: "1.0",
  hasPermssion: 0,
  credits: "Biru + modified by val",
  description: "Download TikTok video via URL",
  usePrefix: true,
  commandCategory: "Media",
  usage: "+tikdl <tiktok video url>",
  cooldowns: 5,
};

module.exports.run = async function({ api, event, args }) {
  try {
    const tiktokUrl = args.join(" ");
    if (!tiktokUrl || !tiktokUrl.startsWith("http")) {
      return api.sendMessage("❌ | Please provide a valid TikTok video URL.\n\nExample:\n+tikdl https://vt.tiktok.com/ZSSepqB7m/", event.threadID);
    }

    api.sendMessage("⏳ | Fetching TikTok video info, please wait...", event.threadID);

    const response = await axios.get(`https://vneerapi.onrender.com/tikdl?url=${encodeURIComponent(tiktokUrl)}`);
    const video = response.data;

    if (!video.downloadLink) {
      return api.sendMessage("⚠️ | Failed to extract the video download link.", event.threadID);
    }

    const filePath = path.join("/tmp", `tikdl_${Date.now()}.mp4`);
    const writer = fs.createWriteStream(filePath);

    const videoStream = await axios({
      method: 'get',
      url: video.downloadLink,
      responseType: 'stream',
    });

    videoStream.data.pipe(writer);

    writer.on("finish", () => {
      const caption = `🎬 𝗧𝗶𝗸𝗧𝗼𝗸 𝗩𝗶𝗱𝗲𝗼\n\n👤 Author: ${video.author}\n📝 Description: ${video.description}\n❤️ Likes: ${video.likes}\n💬 Comments: ${video.comments}`;
      api.sendMessage(
        { body: caption, attachment: fs.createReadStream(filePath) },
        event.threadID,
        () => fs.unlinkSync(filePath)
      );
    });

    writer.on("error", (err) => {
      console.error("File write error:", err);
      api.sendMessage("❌ | Failed to save the video file.", event.threadID);
    });

  } catch (err) {
    console.error("TikTok DL Error:", err);
    api.sendMessage("❌ | An error occurred while downloading the TikTok video.", event.threadID);
  }
};
