module.exports.config = {
    name: "teach",
    version: "1.0.1",
    hasPermssion: 0,
    usePrefix: true,
    credits: "KENLIEPLAYS, modified by biru",
    description: "Teach SimSimi a new response",
    commandCategory: "sim",
    usages: "[ask] - [answer]",
    cooldowns: 2,
};

module.exports.run = async function({ api, event, args }) {
    const axios = require("axios");
    let { messageID, threadID } = event;
    let tid = threadID,
    mid = messageID;
    const input = args.join(" ").split("-");

    if (input.length < 2) {
        if (args.length == 0) {
            return api.sendMessage("Usage: teach [ask] - [answer]", tid, mid);
        } else if (args.join(" ").includes("-")) {
            return api.sendMessage("Please provide both a question and an answer.", tid, mid);
        } else {
            return api.sendMessage("Please use '-' character to separate the question and answer.", tid, mid);
        }
    }

    const ask = encodeURIComponent(input[0].trim());
    const answer = encodeURIComponent(input[1].trim());

    try {
        const res = await axios.get(`https://simsimi.ooguy.com/teach?ask=${ask}&ans=${answer}&apikey=7d5c9a9e9373475bba7f333ec5f18ee15994cb2b`);
        const data = res.data;

        if (data.message && data.teachResponse && data.teachResponse.respond) {
            const responseMessage = `${data.message}\n${data.teachResponse.respond}`;
            api.sendMessage(responseMessage, tid, mid);
        } else {
            api.sendMessage("Unexpected response from the API.", tid, mid);
        }
    } catch (error) {
        console.error(error);
        api.sendMessage("An error occurred while processing the request.", tid, mid);
    }
};
