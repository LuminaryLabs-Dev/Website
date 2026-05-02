const nodemailer = require('nodemailer');

export default async function handler(req, res) {
    // 1. Set CORS headers to allow the browser's Preflight Check
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 2. Intercept and approve the browser's 'OPTIONS' request instantly
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. Keep our security guard for the actual submission
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });

    try {
        await transporter.sendMail({
            from: `"NexusCentral" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER,
            replyTo: email,
            subject: 'New Waitlist Signup 🎉',
            text: `A new user has joined the waitlist: ${email}`
        });

        return res.status(200).json({ message: 'Successfully joined waitlist' });
    } catch (error) {
        console.error('SMTP Error:', error);
        return res.status(500).json({ error: 'Failed to process email' });
    }
}