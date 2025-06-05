const axios = require('axios');

const config = {
    name: "gagstock",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Biru",
    description: "Check GrowAGarden stock info",
    usePrefix: true,
    commandCategory: "Info",
    usages: "+gagstock",
    cooldowns: 5,
};

const categories = [
    { name: "Refresh", url: "https://growagardenstock.vercel.app/api/refresh" },
    { name: "All", url: "https://growagardenstock.vercel.app/api/stock/all" },
    { name: "Weather", url: "https://growagardenstock.vercel.app/api/weather" },
    { name: "Gear", url: "https://growagardenstock.vercel.app/api/stock/gear" },
    { name: "Seeds", url: "https://growagardenstock.vercel.app/api/stock/seeds" },
    { name: "Egg", url: "https://growagardenstock.vercel.app/api/stock/egg" },
    { name: "Honey", url: "https://growagardenstock.vercel.app/api/stock/honey" },
    { name: "Cosmetics", url: "https://growagardenstock.vercel.app/api/stock/cosmetics" }
];

async function run({ api, event }) {
    let message = "🪴 Choose a category to view:\n";
    categories.forEach((cat, index) => {
        message += `${index}. ${cat.name}\n`;
    });

    api.sendMessage(message, event.threadID, (err, info) => {
        if (err) return console.error(err);

        global.client.handleReply.push({
            type: "stockCategory",
            name: config.name,
            author: event.senderID,
            messageID: info.messageID
        });
    });
}

async function handleReply({ api, event, handleReply }) {
    const index = parseInt(event.body);
    if (isNaN(index) || index < 0 || index >= categories.length) {
        return api.sendMessage("❌ Invalid choice. Please reply with a number from the list.", event.threadID, event.messageID);
    }

    const { name, url } = categories[index];
    try {
        const res = await axios.get(url);
        const data = res.data;

        if (index === 2) { // Weather
            const msg = `🌤 Weather Report:
- ${data.icon} ${data.currentWeather}
- ${data.description}
- 🌱 Bonus: ${data.cropBonuses}
- 📅 Updated: ${new Date(data.last_updated).toLocaleString()}`;
            return api.sendMessage(msg, event.threadID, event.messageID);
        }

        if (index === 1) { // All Stock
            let allStockMsg = "📦 All Stock:\n";
            for (const [key, stock] of Object.entries(data)) {
                allStockMsg += `\n🔸 ${stock.name}\n⏳ ${stock.countdown.formatted}\n📦 Items: ${stock.items.length}\n`;
            }
            return api.sendMessage(allStockMsg, event.threadID, event.messageID);
        }

        if (data.name && data.items) { // Single stock category
            let stockMsg = `📦 ${data.name}\n⏳ Reset in: ${data.countdown.formatted}\n`;
            if (data.items.length === 0) {
                stockMsg += "No items available.";
            } else {
                stockMsg += "Items:\n";
                data.items.forEach(item => {
                    stockMsg += `- ${item.name}: ${item.quantity}\n`;
                });
            }
            return api.sendMessage(stockMsg, event.threadID, event.messageID);
        }

        if (index === 0) { // Refresh
            return api.sendMessage("🔄 Stock refreshed successfully!", event.threadID, event.messageID);
        }

    } catch (err) {
        console.error(err);
        return api.sendMessage("❌ Failed to fetch data. Please try again later.", event.threadID, event.messageID);
    }
}

module.exports.config = config;
module.exports.run = run;
module.exports.handleReply = handleReply;
