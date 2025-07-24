const axios = require("axios");
const cron = require("node-cron");

const chatEnabledMap = new Map();
const forcedOffMap = new Map(); // stores threads manually turned off

module.exports.config = {
    name: "chat",
    version: "4.4.0",
    hasPermission: 0,
    credits: "ZiaRein/Modified By Biru + AutoOnByVal",
    usePrefix: false,
    description: "Chat via SimSimi Ph ver",
    commandCategory: "chatbot",
    usages: [`Please add some context\n\nHow to use?\n${global.config.PREFIX}chat <context>\n\nExample:\n${global.config.PREFIX}chat hi\n`, "on", "off"],
    cooldowns: 5,
    dependencies: {
        axios: "",
        "node-cron": ""
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

    // Every 30 minutes → Auto turn chat ON & say "hi"
    cron.schedule("*/30 * * * *", async () => {
        for (let [threadID] of chatEnabledMap) {
            if (!forcedOffMap.get(threadID)) {
                chatEnabledMap.set(threadID, true);
                try {
                    await api.sendMessage("hi", threadID);
                    console.log(`[Auto ON] Sent "hi" to ${threadID}`);
                } catch (e) {
                    console.error(`Failed to send "hi" to ${threadID}`, e);
                }
            }
        }
    });

    // After 10 mins → Auto turn chat OFF & say "bye"
    cron.schedule("10-59/30 * * * *", async () => {
        for (let [threadID] of chatEnabledMap) {
            if (!forcedOffMap.get(threadID)) {
                chatEnabledMap.set(threadID, false);
                try {
                    await api.sendMessage("bye", threadID);
                    console.log(`[Auto OFF] Sent "bye" to ${threadID}`);
                } catch (e) {
                    console.error(`Failed to send "bye" to ${threadID}`, e);
                }
            }
        }
    });
};

module.exports.handleEvent = async function ({ api, event }) {
    const { threadID, messageID, senderID, body } = event;
    const reply = (msg) => api.sendMessage(msg, threadID, messageID);
    const botUserID = global.config.BOT_ID;

    if (chatEnabledMap.has(threadID) && senderID !== botUserID && chatEnabledMap.get(threadID)) {
        if (body === "" || messageID === global.simsimi.get(threadID)) return;
        const { data, error } = await simsimi(body);
        if (!error) {
            const randomDelay = Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000;
            await delay(randomDelay);
            reply(data);
        }
    }
};

module.exports.run = async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const reply = (msg) => api.sendMessage(msg, threadID, messageID);

    if (args[0] === "on") {
        chatEnabledMap.set(threadID, true);
        forcedOffMap.set(threadID, false); // remove override
        return reply("🟢");
    }

    if (args[0] === "off") {
        chatEnabledMap.set(threadID, false);
        forcedOffMap.set(threadID, true); // set override
        return reply("🔴");
    }

    if (chatEnabledMap.has(threadID) && chatEnabledMap.get(threadID) && args.length === 0) {
        return reply(`Please add some context\n\nHow to use?\n${global.config.PREFIX}chat <context>\n\nExample:\n${global.config.PREFIX}chat how are you\n\n🗨️`);
    }

    const { data, error } = await simsimi(args.join(" "));
    if (!error) {
        const randomDelay = Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000;
        await delay(randomDelay);
        reply(data);
    }
};
