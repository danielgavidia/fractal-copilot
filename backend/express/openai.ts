import OpenAI from "openai";
const openai = new OpenAI({ apiKey: process.env.OPENAI_TOKEN });

export const getDiffSummary = async (diff: string) => {
    const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are a helpful assistant tasked with summarizing text effectively. 
                    You will be provided strings containing the code changes in Github pull requests. 
                    They are called 'Diffs'. 
                    Avoid starting your answer with 'This pull request...' or 'The pull request' or using the passive voice.`,
            },
            {
                role: "user",
                content: `In 100 characters maximum, summarize the following pull request diff: ${diff}`,
            },
        ],
    });
    return res.choices[0].message.content;
};
