const express = require("express");
const router = express.Router();
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const verifyFirebaseToken = require("../middleware/auth");

const OpenAI = require("openai");
const openai = new OpenAI();

router.get("/userQuery", verifyFirebaseToken, );

router.post("/ask", async (req, res) => {
    try {
        const userQuestion = req.body.question;
        if(!userQuestion) {
            return res.status(400).json({ error: 'Question is required' })
        }

        const chatCompletion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: "You are a helpful and knowledgebale financial assistant whose role is to provide financial insights."
                },
                {
                    role:'user',
                    content: userQuestion,
                },
            ],
        });

        const answer = chatCompletion.choices[0].message.content;
        res.json({ answer });
    }   catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get response from OpenAI' });
    }
});

module.exports = router;
