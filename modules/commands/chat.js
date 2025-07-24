const axios = require("axios");
const { CronJob } = require("cron");

const chatEnabledMap = new Map();
const forceDisabledMap = new Map(); // to track if manually disabled

module.exports.config = {
    name: "chat",
    version: "4.3.9-auto",
    hasPermission: 0,
    credits: "ZiaRein/Modified By Biru + ChatGPT",
    usePrefix: false,
    description: "Chat via SimSimi PH ver + Auto Mode",
    commandCategory: "chatbot",
    usages: [`chat <message>`, "on", "off"],
    cooldowns: 5,
    dependencies: {
        axios: "",
        cron: ""
    }
};

async function simsimi(content) {
    const encodedContent = encodeURIComponent(content);
    const apiUrl = `https://simsimi.ooguy.com/sim?query=${encodedContent}&apikey=7d5c9a9e9373475bba7f333ec5f18ee15994cb2b`;

    try {
        const response = await axios.get(apiUrl);
        if (response.data && response.data.respond) {
            return { error: false, data: response.data.respond };
        } else {
            return { error: true, data: {} };
        }
    } catch (error) {
        console.error("API Request Error: ", error);
        return { error: true, data: {} };
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.onLoad = async function ({ api }) {
    if (typeof global === "undefined") global = {};
    if (typeof global.simsimi === "undefined") global.simsimi = new Map;

    // Auto-enable every 30 minutes
    new CronJob("*/30 * * * *", async function () {
        const allThreads = [...chatEnabledMap.keys()];
        if (allThreads.length === 0) return;

        for (const threadID of allThreads) {
            if (forceDisabledMap.get(threadID)) continue; // skip if forcefully off

            chatEnabledMap.set(threadID, true);
            api.sendMessage("hi", threadID);

            // Schedule auto-disable after 10 minutes
            setTimeout(() => {
                if (!forceDisabledMap.get(threadID)) {
                    chatEnabledMap.set(threadID, false);
                    api.sendMessage("bye", threadID);
                }
            }, 10 * 60 * 1000);
        }
    }, null, true, "Asia/Manila"); // change TZ if needed
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body } = event;
    const send = (msg) => api.sendMessage(msg, threadID, messageID);

    if (!chatEnabledMap.get(threadID) || senderID == global.config.BOT_ID || !body) return;

    if (global.simsimi.get(threadID) === messageID) return;

    const { data, error } = await simsimi(body);
    if (!error) {
        const randomDelay = Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000;
        await delay(randomDelay);
        send(data);
    }
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const send = (msg) => api.sendMessage(msg, threadID, messageID);

    if (args[0] === "on") {
        chatEnabledMap.set(threadID, true);
        forceDisabledMap.set(threadID, false);
        send("The chat is now enabled.");
        return;
    }

    if (args[0] === "off") {
        chatEnabledMap.set(threadID, false);
        forceDisabledMap.set(threadID, true);
        send("The chat is now disabled.");
        return;
    }

    if (!chatEnabledMap.get(threadID)) {
        send("Chatbot is disabled. Use 'chat on' to enable.");
        return;
    }

    if (args.length === 0) {
        send(`Please add some context\n\nHow to use?\n${global.config.PREFIX}chat <context>`);
        return;
    }

    const { data, error } = await simsimi(args.join(" "));
    if (!error) {
        const randomDelay = Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000;
        await delay(randomDelay);
        send(data);
    }
};
