const nodemailer = require('nodemailer');

export default async function handler(req, res) {
    // 1. Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 2. Extract the email from the frontend request
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // 3. Connect to Google Workspace SMTP securely
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.GMAIL_USER,         // e.g., hello@nexuscentral.com
            pass: process.env.GMAIL_APP_PASSWORD  // Your 16-character Google App Password
        }
    });

    try {
        // 4. Send the notification email to your team
        await transporter.sendMail({
            from: `"NexusCentral" <${process.env.GMAIL_USER}>`,
            to: process.env.GMAIL_USER, // Sending it to yourself
            replyTo: email,             // Makes it easy to reply directly to the user
            subject: 'New Waitlist Signup 🎉',
            text: `A new user has joined the waitlist: ${email}`
        });

        // 5. Tell the frontend it was successful
        return res.status(200).json({ message: 'Successfully joined waitlist' });
    } catch (error) {
        console.error('SMTP Error:', error);
        return res.status(500).json({ error: 'Failed to process email' });
    }
}