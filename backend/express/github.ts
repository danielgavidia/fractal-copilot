import axios from "axios";

export const getPullRequests = async (req: { owner: string; repo: string; state: string }) => {
    const { owner, repo, state } = req;
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}`;
    try {
        const res = await axios({
            method: "GET",
            url: url,
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3+json",
            },
        });
        return res.data;
    } catch (error) {
        console.log(error);
    }
};

export const getPullRequestDiff = async (req: { owner: string; repo: string; number: number }) => {
    const { owner, repo, number } = req;
    const url = `https://api.github.com/repos/${owner}/${repo}/pulls/${number}`;
    try {
        const res = await axios({
            method: "GET",
            url: url,
            headers: {
                Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
                Accept: "application/vnd.github.v3.diff",
            },
        });
        return res.data;
    } catch (error) {
        console.log(error);
    }
};
