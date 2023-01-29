const axios = require('axios');
const cron = require('cron');
const MongoClient = require('mongodb').MongoClient;
const nodemailer = require('nodemailer');

require('dotenv').config();

const mongodb_url = process.env.MONGO_URL;
const mailFrom = process.env.MAIL_FROM;
const mailPass = process.env.MAIL_FROM_PASSWORD;
const dbName = process.env.DB_NAME;
const collectionName = process.env.COLLECTION_NAME;

// Replace with the API endpoint for your data
const twitterDataPullAPI = process.env.TWITTER_DATA_PULL_SVC_BASE_URL + '/get_sentiments';

// Fetch the tweetData data from the API
const fetchTwitterData = async (query) => {
    const response = await axios.post(twitterDataPullAPI, { query, count: 1000 });
    return response.data;
}

// Send an email to the user with the tweetData data
const sendNewsletterEmail = async (user) => {
    const { category } = user;
    const tweetData = await fetchTwitterData(category);
    const mailOptions = {
        from: mailFrom,
        to: user.email,
        subject: `${String(category).toUpperCase()} - Daily Report`,
        text: `${JSON.stringify(tweetData, null, 4)}.`
    };
    const transporter = await nodemailer.createTransport({
        service: 'gmail',
        port: 465,
        secure: true,
        auth: {
            user: mailFrom,
            pass: mailPass,
        },
        tls: {
            rejectUnauthorized: false
        }
    });
    const mailInfo = await transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('error : transporter :', error);
        } else {
            console.log(`Email sent to ${user.email} - ${nodemailer.getTestMessageUrl(info)}`);
        }
    });
}

// Retrieve the users from the MongoDB collection and send them the tweetData data via email
const sendNewsletterEmails = () => {
    MongoClient.connect(mongodb_url, { useNewUrlParser: true }, (err, client) => {
        if (err) throw err;
        const db = client.db(dbName);
        db.collection(collectionName).find({ deletedAt: { $exists: false } }).toArray((err, users) => {
            if (err) throw err;
            users.forEach(async (user) => {
                console.log('user - ', user)
                await sendNewsletterEmail(user);
            });
            client.close();
        });
    });
}

// Schedule the cron
const job = new cron.CronJob('*/1 * * * * *', sendNewsletterEmails, null, false);
job.start();
