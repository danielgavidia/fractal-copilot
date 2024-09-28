import { Client, GatewayIntentBits } from "discord.js";
import axios from "axios";

const BASE_URL = "http://localhost:3000";

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
client.on("messageCreate", async (message) => {
    // Prevent bot from responding to itself
    if (message.author.bot) return;

    // Logic
    const messageArray = message.content.split(" ");
    if (messageArray[0] === "summary") {
        try {
            const res = await axios({
                method: "GET",
                url: `${BASE_URL}/github/pr-ids/danielgavidia/${messageArray[1]}/closed`,
            });

            const data = res.data;
            console.log(data);

            interface Block {
                number: number;
                link: string;
                summary: string;
            }

            const getMessage = (block: Block) => {
                const msg = `- **[PR ${block.number.toString().padStart(3, "0")}](<${
                    block.link
                }>)**: ${block.summary}`;
                return msg;
            };
            const messageFormatted = data.map((x: Block) => getMessage(x)).join("\n");
            console.log(messageFormatted);
            message.channel.send(messageFormatted);
        } catch (error) {
            console.log(error);
            message.channel.send("Error");
        }
    }
});

// Log in to Discord with your token
client.login(process.env.DISCORD_TOKEN);
