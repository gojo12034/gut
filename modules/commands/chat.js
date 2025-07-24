const axios = require("axios");
const chatEnabledMap = new Map();

module.exports.config = {
    name: "chat",
    version: "4.3.9",
    hasPermission: 0,
    credits: "ZiaRein/Modified By Biru",
    usePrefix: false,
    description: "Chat via SimSimi Ph ver",
    commandCategory: "chatbot",
    usages: [`Please add some context\n\nHow to use?\n${global.config.PREFIX}chat <context>\n\nExample:\n${global.config.PREFIX}chat hi\n`, "on", "off"],
    cooldowns: 5,
    dependencies: {
        axios: ""
    }
};

async function simsimi(content) {
    const encodedContent = encodeURIComponent(content);
    const apiUrl = `https://simsimi.ooguy.com/sim?query=${encodedContent}&apikey=7d5c9a9e9373475bba7f333ec5f18ee15994cb2b`;

    //console.log("API URL: ", apiUrl);

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

// Utility: Delay in ms
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports.onLoad = async function () {
    if (typeof global === "undefined") global = {};
    if (typeof global.simsimi === "undefined") global.simsimi = new Map;
};

module.exports.handleEvent = async function ({ api: b, event: a }) {
    const { threadID: c, messageID: d, senderID: e, body: f } = a;
    const g = (e) => b.sendMessage(e, c, d);

    const botUserID = global.config.BOT_ID;

    if (chatEnabledMap.has(c) && e != botUserID && chatEnabledMap.get(c)) {
        if (f === "" || d == global.simsimi.get(c)) return;
        const { data: h, error: i } = await simsimi(f);

        if (!i) {
            const randomDelay = Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000;
            await delay(randomDelay);
            g(h);
        }
        return;
    }
};

module.exports.run = async function ({ api: b, event: a, args: c }) {
    const { threadID: d, messageID: e } = a;
    const f = (c) => b.sendMessage(c, d, e);

    const botUserID = global.config.BOT_ID;

    if (c[0] === "on") {
        chatEnabledMap.set(d, true);
        f("The chat is now enabled.");
        return;
    }

    if (c[0] === "off") {
        chatEnabledMap.set(d, false);
        f("The chat is now disabled.");
        return;
    }

    if (chatEnabledMap.has(d) && chatEnabledMap.get(d) && c.length === 0) {
        f(`Please add some context\n\nHow to use?\n${global.config.PREFIX}chat <context>\n\nExample:\n${global.config.PREFIX}chat how are you\n\n 🗨️`);
        return;
    }

    const { data: g, error: h } = await simsimi(c.join(" "));

    if (!h) {
        const randomDelay = Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000;
        await delay(randomDelay);
        f(g);
    }
};
