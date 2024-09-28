// libraries
import express from "express";
import axios from "axios";
import { convertToDateString } from "../utils/datetime";

// setup
const app = express();
const port = 3000;
const cors = require("cors");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// root
app.get("/", (req, res) => {
    res.send("Hello World!");
});

// port listen
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// get Github repos
app.get("/github/pr-ids/:owner/:repo/:state", async (req, res) => {
    try {
        // step 1: get Github PRs for a given owner, repo, and state
        const owner = req.params.owner;
        const repo = req.params.repo;
        const state = req.params.state;
        const resGithub = await axios({
            method: "GET",
            url: `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}`,
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json",
            },
        });

        // step 2: generate {closed-date, pr-id}[] from PRs array
        interface PR {
            number: number;
            closedAt: string;
        }
        const prs: PR[] = resGithub.data.map((x: { number: number; closed_at: string }) => ({
            number: x.number,
            closedAt: convertToDateString(x.closed_at),
        }));

        // step 3: generate closed-date[] from {closed-date, pr-id}[]
        const dates: string[] = prs.map((x) => x.closedAt);

        // step 4: sort [closed-date] desc and choose first item
        const prsFinal: PR[] = prs.filter(
            (x: { number: number; closedAt: string }) => x.closedAt === dates[0]
        );
        console.log(prs);
        res.status(200).json({ data: prsFinal });
    } catch (error) {
        res.status(400).json({ message: error });
    }
});

// import fetch from 'node-fetch';

// // Function to get diff from GitHub API
// async function getGitHubDiff(owner: string, repo: string, pullNumber: number, token: string): Promise<string | null> {
//     const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`;

//     try {
//         const response = await fetch(url, {
//             method: 'GET',
//             headers: {
//                 'Authorization': `Bearer ${token}`,
//                 'Accept': 'application/vnd.github.v3.diff',  // Getting diff format
//             },
//         });

//         if (!response.ok) {
//             throw new Error(`Error fetching pull request diff: ${response.statusText}`);
//         }

//         const diff = await response.text();  // GitHub API returns plain text diff
//         return diff;
//     } catch (error) {
//         console.error(error);
//         return null;
//     }
// }

// // Function to format the diff in Markdown code block (ChatGPT format)
// function formatDiffForChatGPT(diff: string): string {
//     // Wrap the diff in a Markdown code block for ChatGPT
//     return `Here is the diff from the pull request:\n\n\`\`\`diff\n${diff}\n\`\`\``;
// }

// // Function to send formatted diff to ChatGPT API
// async function sendToChatGPT(diff: string, openAIApiKey: string): Promise<void> {
//     const url = 'https://api.openai.com/v1/chat/completions';

//     const chatGPTRequestBody = {
//         model: "gpt-4",  // Using GPT-4 model
//         messages: [
//             {
//                 role: "user",
//                 content: formatDiffForChatGPT(diff)
//             }
//         ]
//     };

//     try {
//         const response = await fetch(url, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${openAIApiKey}`,
//             },
//             body: JSON.stringify(chatGPTRequestBody),
//         });

//         if (!response.ok) {
//             throw new Error(`Error sending to ChatGPT: ${response.statusText}`);
//         }

//         const chatGPTResponse = await response.json();
//         console.log("ChatGPT Response:", chatGPTResponse);
//     } catch (error) {
//         console.error(error);
//     }
// }

// // Main function to coordinate the flow
// async function main() {
//     const owner = 'your-username';
//     const repo = 'your-repo-name';
//     const pullNumber = 5;  // Example pull request number
//     const githubToken = 'your-github-token';  // GitHub Personal Access Token
//     const openAIApiKey = 'your-openai-api-key';  // OpenAI API key

//     // Step 1: Get the diff from GitHub
//     const diff = await getGitHubDiff(owner, repo, pullNumber, githubToken);

//     if (diff) {
//         // Step 2: Send the formatted diff to the ChatGPT API
//         await sendToChatGPT(diff, openAIApiKey);
//     } else {
//         console.log("Failed to retrieve the diff from GitHub.");
//     }
// }

// // Execute the main function
// main();
