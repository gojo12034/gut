const axios = require("axios");
const fs = require("fs");
const { promisify } = require("util");

const unlinkAsync = promisify(fs.unlink);

module.exports.config = {
  name: "fbdown",
  version: "1.4.0",
  hasPermission: 0,
  credits: "Biru",
  usePrefix: true,
  description: "Download and send a Facebook video",
  commandCategory: "Utility",
  usages: "fbdl [video URL]",
  cooldowns: 10,
};

module.exports.run = async function ({ api, event, args }) {
  if (args.length === 0) {
    await api.sendMessage("Please provide a valid Facebook video URL.", event.threadID);
    return;
  }

  const videoURL = args[0];

  try {
    const apiUrl = `https://vneerapi.onrender.com/alldl?url=${encodeURIComponent(videoURL)}`;
    const response = await axios.get(apiUrl);

    if (!response.data || !response.data.medias || response.data.medias.length === 0) {
      await api.sendMessage("Failed to retrieve the video. Please check the URL and try again.", event.threadID);
      return;
    }

    
    let selectedMedia = null;

    for (const media of response.data.medias) {
      if (media.quality && media.quality.toLowerCase() === "hd") {
        selectedMedia = media;
        break; // Prefer HD, stop search
      } else if (media.quality && media.quality.toLowerCase() === "sd") {
        if (!selectedMedia) selectedMedia = media; // Fallback to SD if HD not found
      }
    }

    if (!selectedMedia || !selectedMedia.url) {
      await api.sendMessage("Could not find a downloadable video (HD or SD).", event.threadID);
      return;
    }

    const videoTitle = response.data.title || "Facebook Video";
    const videoQuality = selectedMedia.quality.toUpperCase();
    const videoSize = selectedMedia.formattedSize || `${(selectedMedia.size / 1024).toFixed(2)} KB`;
    const videoDuration = response.data.duration ? `${response.data.duration} seconds` : "Unknown duration";
    const videoThumbnail = response.data.thumbnail;

    
    const detailsMessage = `🎬 **${videoTitle}**\n` +
                           `🔹 Quality: ${videoQuality}\n` +
                           `🔹 Size: ${videoSize}\n` +
                           `🔹 Duration: ${videoDuration}\n` +
                           `🔗 ${videoURL}`;

    
    const msgData = { body: detailsMessage };
    if (videoThumbnail) {
      const thumbRes = await axios.get(videoThumbnail, { responseType: "arraybuffer" });
      const thumbPath = `${Date.now()}_thumb.jpg`;
      await fs.promises.writeFile(thumbPath, thumbRes.data);
      msgData.attachment = fs.createReadStream(thumbPath);
      await api.sendMessage(msgData, event.threadID);
      await unlinkAsync(thumbPath);
    } else {
      await api.sendMessage(msgData, event.threadID);
    }

    
    await api.sendMessage("Downloading the video now, please wait...", event.threadID);

    const videoBuffer = await axios.get(selectedMedia.url, { responseType: "arraybuffer" });

    const videoFileName = `${Date.now()}.mp4`;
    await fs.promises.writeFile(videoFileName, videoBuffer.data);
    const videoStream = fs.createReadStream(videoFileName);

    await api.sendMessage({ attachment: videoStream }, event.threadID);

    await unlinkAsync(videoFileName);
  } catch (error) {
    console.error("Error fetching or sending the video:", error);
    await api.sendMessage(
      "An error occurred while processing your request. Please try again later.",
      event.threadID
    );
  }
};
