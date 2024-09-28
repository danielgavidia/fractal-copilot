// libraries
import express from "express";
import { convertToDateString } from "../utils/datetime";
import {
    getPullRequestDiffSummary,
    getPullRequestManyBlockers,
    getPullRequestManyLearnings,
    getPullRequestManyWins,
} from "./openai";
import { getPullRequests, getPullRequestDiff } from "./github";

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

// get Github PR summaries, generated with OpenAI integration
app.get("/github/prs/:owner/:repo/:date", async (req, res) => {
    try {
        // step 1: get Github PRs for a given owner, repo, and state
        const owner = req.params.owner;
        const repo = req.params.repo;
        const date = req.params.date;
        const prs = await getPullRequests({ owner, repo, state: "closed" });

        // step 2: filter PRs by date
        const prsFiltered = prs.filter((x: any) => convertToDateString(x.closed_at) === date);

        // step 3: pull PR diff texts
        const prDiffs = await Promise.all(
            prsFiltered.map((pr: any) =>
                getPullRequestDiff({ owner: owner, repo: repo, number: pr.number })
            )
        );

        // step 4: get PR diff OpenAI summaries
        const prSummaries = await Promise.all(
            prDiffs.map((diff) => getPullRequestDiffSummary(diff))
        );

        // step 5: create final object with proper keys
        const final = prSummaries
            .map((x, index) => {
                return {
                    number: prs[index]?.number,
                    link: `https://www.github.com/${owner}/${repo}/pull/${prDiffs[index]?.number}`,
                    summary: x,
                };
            })
            .sort((a, b) => (a.number || 0) - (b.number || 0));
        res.status(200).json(final);
    } catch (error) {
        res.status(400).json({ message: error });
    }
});

// get blockers, learnings, and wins
app.get("/github/prs/general/:owner/:repo/:date", async (req, res) => {
    try {
        const owner = req.params.owner;
        const repo = req.params.repo;
        const date = req.params.date;

        // retrieve Github PRs
        const prs = await getPullRequests({ owner, repo, state: "closed" });
        const prsFiltered = prs.filter((x: any) => convertToDateString(x.closed_at) === date);

        // get GitHub PR diffs and concat into single string
        const prDiffs = await Promise.all(
            prsFiltered.map((pr: any) =>
                getPullRequestDiff({ owner: owner, repo: repo, number: pr.number })
            )
        );
        const prDiffConcat = prDiffs.join("\n");
        console.log(prDiffConcat);

        // send to OpenAI and get: blockers
        const blockers = await getPullRequestManyBlockers(prDiffConcat);

        // send to OpenAI and get: learnings
        const learnings = await getPullRequestManyLearnings(prDiffConcat);

        // send to OpenAI and get: wins
        const wins = await getPullRequestManyWins(prDiffConcat);

        // return all three objects as part of single object
        const response = {
            blockers: blockers,
            learnings: learnings,
            wins: wins,
        };

        res.status(200).json(response);
    } catch (error) {
        res.status(400).json({ message: error });
    }
});
