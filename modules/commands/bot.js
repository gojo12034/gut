const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: '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' });

// Initialize a Map to store the message history for each user
const messageHistory = new Map();

module.exports.config = {
  name: "bot",
  version: "0.0.3",
  hasPermssion: 0,
  credits: "Biru Aren",
  description: "Just a bot",
  commandCategory: "ai",
  usePrefix: false,
  usages: "ask anything",
  cooldowns: 5,
  dependencies: {}
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID, senderID } = event;
  let userMessage = args.join(" ");

  // Log the initial user message
  console.log("Initial User's Message:", userMessage);

  // Indicate that the bot is processing the request
  api.setMessageReaction("⌛", messageID, (err) => {}, true);
  

  // Initialize user history
  let userHistory = messageHistory.get(senderID) || [];
  if (userHistory.length === 0) {
    userHistory.push({ role: "system", content: "You are a helpful and kind assistant that answers everything." });
  }
  userHistory.push({ role: "user", content: userMessage });

  try {
    // Send the request to the Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: userHistory,
      model: "llama3-8b-8192",
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
      stream: true,
      stop: null
    });

    // Collect the response message from the stream
    let responseMessage = '';
    for await (const chunk of chatCompletion) {
      responseMessage += chunk.choices[0]?.delta?.content || '';
    }

    // Append the assistant's response to the history
    userHistory.push({ role: "assistant", content: responseMessage });

    // Update the message history for the user
    messageHistory.set(senderID, userHistory);

    // Send the response message back to the user
    api.setMessageReaction("✅", messageID, (err) => {}, true);
    api.sendMessage(responseMessage, threadID, (err, info) => {
      if (err) return console.error(err);

      // Log that the bot's response was successfully sent
      console.log("Bot's Response Sent:", responseMessage);

      // Set up handleReply to capture further replies
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID,
        type: "reply",
        userHistory
      });
    });
  } catch (error) {
    // Handle errors and send a default message
    console.error("Error communicating with Groq:", error.message);
    api.sendMessage("I'm busy right now, I'm pooping", threadID);
  }
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  const { threadID, messageID, senderID, body } = event;
  if (handleReply.author !== senderID) return;

  let userHistory = handleReply.userHistory;

  // Append the user's reply to the history
  userHistory.push({ role: "user", content: body });

  // Log the user's reply
  console.log("User's Reply:", body);

  
  try {
    // Send the request to the Groq API
    const chatCompletion = await groq.chat.completions.create({
      messages: userHistory,
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 1,
      max_tokens: 1024,
      top_p: 1,
      stream: true,
      stop: null
    });

    // Collect the response message from the stream
    let responseMessage = '';
    for await (const chunk of chatCompletion) {
      responseMessage += chunk.choices[0]?.delta?.content || '';
    }

    // Append the assistant's response to the history
    userHistory.push({ role: "assistant", content: responseMessage });

    // Update the message history for the user
    messageHistory.set(senderID, userHistory);

    // Send the response message back to the user
    api.sendMessage(responseMessage, threadID, (err, info) => {
      if (err) return console.error(err);

      // Log that the bot's response was successfully sent
      console.log("Bot's Response Sent:", responseMessage);

      // Update handleReply with the new history for the next reply
      global.client.handleReply = global.client.handleReply.map(item =>
        item.messageID === handleReply.messageID ? { ...item, userHistory } : item
      );

      // Set up handleReply again to capture further replies
      global.client.handleReply.push({
        name: this.config.name,
        messageID: info.messageID,
        author: senderID,
        type: "reply",
        userHistory
      });
    });
  } catch (error) {
    // Handle errors and send a default message
    console.error("Error communicating with Groq:", error.message);
    api.sendMessage("I'm busy right now, planning to eradicate you humans.", threadID);
  }
};
