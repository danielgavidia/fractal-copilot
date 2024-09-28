// libraries
import express from "express";
import axios from "axios";
import { convertToDateString } from "../utils/datetime";
import { getDiffSummary } from "./openai";

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

        // step 5: for every PR number in prsFinal, pull diff text
        const getPullRequestDiff = async (
            owner: string,
            repo: string,
            closedAt: string,
            pullRequestNumber: number
        ) => {
            const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${pullRequestNumber}`;
            try {
                const res = await axios({
                    method: "GET",
                    url: url,
                    headers: {
                        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                        Accept: "application/vnd.github.v3.diff",
                    },
                });
                return { number: pullRequestNumber, closedAt: closedAt, diff: res.data };
            } catch (error) {
                console.log(error);
            }
        };
        const prDiffs = await Promise.all(
            prsFinal.map((pr) => getPullRequestDiff(owner, repo, pr.closedAt, pr.number))
        );
        const prSummaries = await Promise.all(prDiffs.map((pr) => getDiffSummary(pr?.diff)));
        const final = prSummaries.map((x, index) => {
            return {
                number: prDiffs[index]?.number,
                link: `https://www.github.com/${owner}/${repo}/pull/${prDiffs[index]?.number}`,
                summary: x,
            };
        });
        res.status(200).json({ data: final.sort((a, b) => (a.number || 0) - (b.number || 0)) });
    } catch (error) {
        res.status(400).json({ message: error });
    }
});
