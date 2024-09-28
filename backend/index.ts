import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// Event when the bot is ready
client.once("ready", () => {
    console.log("Bot is online");
});

// Event when a message is sent in the server
client.on("messageCreate", (message) => {
    // Prevent bot from responding to itself
    if (message.author.bot) return;
    if (message.content === "ping") {
        message.channel.send("pong");
    }
});

// Log in to Discord with your token
client.login(process.env.DISCORD_TOKEN);
