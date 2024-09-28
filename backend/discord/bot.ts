import { Client, GatewayIntentBits } from "discord.js";
import { convertToDateString } from "../utils/datetime";
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
    if (messageArray[0] === "!eod") {
        try {
            // send general PRs summary message
            const resGeneral = await axios({
                method: "GET",
                url: `${BASE_URL}/github/prs/general/danielgavidia/${messageArray[1]}/${messageArray[2]}`,
            });
            const dataGeneral = resGeneral.data;
            const messageGeneral = `**EOD Status Report ${messageArray[2]}: danielgavidia**
- **Blockers**: ${dataGeneral.blockers}
- **Learnings**: ${dataGeneral.learnings}
- **Wins**: ${dataGeneral.wins}
`;
            message.channel.send(messageGeneral);

            // send individual PR message
            const resPullRequests = await axios({
                method: "GET",
                url: `${BASE_URL}/github/prs/danielgavidia/${messageArray[1]}/${messageArray[2]}`,
            });
            const dataPullRequests = resPullRequests.data;

            interface Block {
                number: number;
                link: string;
                summary: string;
            }
            const getMessage = (block: Block) => {
                const msgPullRequests = `- **[PR ${block.number.toString().padStart(3, "0")}](<${
                    block.link
                }>)**: ${block.summary}`;
                return msgPullRequests;
            };
            const messagePullRequestsFormatted = dataPullRequests
                .map((x: Block) => getMessage(x))
                .join("\n");
            message.channel.send(messagePullRequestsFormatted);
        } catch (error) {
            console.log(error);
            message.channel.send("Error");
        }
    }
});

// Log in to Discord with your token
client.login(process.env.DISCORD_TOKEN);
