const axios = require('axios');
const cron = require("node-cron");
const MongoClient = require('mongodb').MongoClient;
const nodemailer = require('nodemailer');
const express = require("express");
app = express(); // Initializing app

require('dotenv').config();

const mongodb_url = process.env.MONGO_URL;
const mailFrom = process.env.MAIL_FROM;
const mailPass = process.env.MAIL_FROM_PASSWORD;
const dbName = process.env.DB_NAME;
const collectionName = process.env.COLLECTION_NAME;
const twitterDataPullAPI = process.env.TWITTER_DATA_PULL_SVC_BASE_URL + '/get_sentiments';
const uiUrl = process.env.UI_URL;
const port = process.env.PORT || 6000;

// Fetch the tweetData data from the API
const fetchTwitterData = async (query) => {
    const response = await axios.post(twitterDataPullAPI, { query, count: 1000 });
    return response.data;
}

const renderHtml = (positiveTweets, negativeTweets) => {
    return `<!DOCTYPE html>
       <html>
       <head>
           <title>Your Daily Report is ready</title>
           <style>
               body {
                   font-family: Arial, sans-serif;
               }
               h1, h2, h3 {
                   text-align: center;
               }
               .container {
                   display: flex;
                   justify-content: center;
               }
               .card {
                   border: 1px solid gray;
                   margin: 16px;
                   padding: 16px;
               }
               .card h4 {
                   text-align: center;
               }
               .positive {
                   background-color: lightgreen;
               }
               .negative {
                   background-color: lightcoral;
               }
           </style>
       </head>
       <body>
           <h1>Your Daily Report is here!</h1>        
           <div class="container">
               <div class="card positive">
                   <h4>Top 5 Positive Tweets</h4>
                   <ul id="positive-tweets">
                   <li>
                        <p>${positiveTweets[0].text}</p>
                        <p>by <strong>${positiveTweets[0].name}</strong> <a href=${`www.twitter.com/${positiveTweets[0].screen_name}`}>(@${positiveTweets[0].screen_name})</a></p>
                        <p>Polarity: ${positiveTweets[0].polarity}</p>
                    </li>
                   <li>
                        <p>${positiveTweets[1].text}</p>
                        <p>by <strong>${positiveTweets[1].name}</strong> <a href=${`www.twitter.com/${positiveTweets[1].screen_name}`}>(@${positiveTweets[1].screen_name})</a></p>
                        <p>Polarity: ${positiveTweets[1].polarity}</p>
                    </li>
                    <li>
                        <p>${positiveTweets[2].text}</p>
                        <p>by <strong>${positiveTweets[2].name}</strong> <a href=${`www.twitter.com/${positiveTweets[2].screen_name}`}>(@${positiveTweets[2].screen_name})</a></p>
                        <p>Polarity: ${positiveTweets[2].polarity}</p>
                    </li>
                    <li>
                        <p>${positiveTweets[3].text}</p>
                        <p>by <strong>${positiveTweets[3].name}</strong> <a href=${`www.twitter.com/${positiveTweets[3].screen_name}`}>(@${positiveTweets[3].screen_name})</a></p>
                        <p>Polarity: ${positiveTweets[3].polarity}</p>
                    </li>
                    <li>
                        <p>${positiveTweets[4].text}</p>
                        <p>by <strong>${positiveTweets[4].name}</strong> <a href=${`www.twitter.com/${positiveTweets[4].screen_name}`}>(@${positiveTweets[4].screen_name})</a></p>
                        <p>Polarity: ${positiveTweets[4].polarity}</p>
                    </li>
                   </ul>
               </div>
               <div class="card negative">
                   <h4>Top 5 Negative Tweets</h4>
                   <ul id="negative-tweets">
                   <li>
                        <p>${negativeTweets[0].text}</p>
                        <p>by <strong>${negativeTweets[0].name}</strong> <a href=${`www.twitter.com/${negativeTweets[0].screen_name}`}>(@${negativeTweets[0].screen_name})</a></p>
                        <p>Polarity: ${negativeTweets[0].polarity}</p>
                    </li>
                   <li>
                        <p>${negativeTweets[1].text}</p>
                        <p>by <strong>${negativeTweets[1].name}</strong> <a href=${`www.twitter.com/${negativeTweets[1].screen_name}`}>(@${negativeTweets[1].screen_name})</a></p>
                        <p>Polarity: ${negativeTweets[1].polarity}</p>
                    </li>
                    <li>
                        <p>${negativeTweets[2].text}</p>
                        <p>by <strong>${negativeTweets[2].name}</strong> <a href=${`www.twitter.com/${negativeTweets[2].screen_name}`}>(@${negativeTweets[2].screen_name})</a></p>
                        <p>Polarity: ${negativeTweets[2].polarity}</p>
                    </li>
                    <li>
                        <p>${negativeTweets[3].text}</p>
                        <p>by <strong>${negativeTweets[3].name}</strong> <a href=${`www.twitter.com/${negativeTweets[3].screen_name}`}>(@${negativeTweets[3].screen_name})</a></p>
                        <p>Polarity: ${negativeTweets[3].polarity}</p>
                    </li>
                    <li>
                        <p>${negativeTweets[4].text}</p>
                        <p>by <strong>${negativeTweets[4].name}</strong> <a href=${`www.twitter.com/${negativeTweets[4].screen_name}`}>(@${negativeTweets[4].screen_name})</a></p>
                        <p>Polarity: ${negativeTweets[4].polarity}</p>
                    </li>
                   </ul>
               </div>
           </div>
           <a href=${uiUrl}>Click Here Unsubscribe</a>
            <br/>
            Have a pleasant day.
            <br/><br/>
            &copy; 2023 Twitter Newsletter (By Mohit Jindal)
       </body>
       </html>`
}

// Send an email to the user with the tweetData data
const sendNewsletterEmail = async (user) => {
    console.log(`sendNewsletterEmail for user ${JSON.stringify(user, null, 4)} at ${new Date()}}`)
    const { category } = user;
    const tweetData = await fetchTwitterData(category);
    const positiveTweets = tweetData.data.top_five_positive;
    const negativeTweets = tweetData.data.top_five_negative;
    const mailOptions = {
        from: `Newsletter via <${mailFrom}>`,
        to: user.email,
        subject: `${String(category).toUpperCase()} - Daily Report`,
        html: renderHtml(positiveTweets, negativeTweets),
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
    await transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('error : transporter :', error);
        } else {
            console.log(`Email sent to ${user.email} - ${info.messageId}`);
        }
    });
}

// Retrieve the users from the MongoDB collection and send them the tweetData data via email
function sendNewsletterEmails() {
    console.log(`sendNewsletterEmails initialized at ${new Date()}`)
    MongoClient.connect(mongodb_url, { useNewUrlParser: true }, (err, client) => {
        if (err) throw err;
        const db = client.db(dbName);
        db.collection(collectionName).find({ deletedAt: { $exists: false } }).toArray(async (err, users) => {
            if (err) throw err;
            await users.forEach(async (user) => {
                await sendNewsletterEmail(user);
            });
            client.close();
        });
    });
}

// Schedule the cron
// cron.schedule('* */1 * * * *', function () {
//     console.log('running at ', new Date())
//     sendNewsletterEmails();
// });
cron.schedule('00 00 00 * * *', sendNewsletterEmails);
app.listen(port);

