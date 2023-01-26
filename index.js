const axios = require('axios');
const cron = require('cron');
const MongoClient = require('mongodb').MongoClient;
const nodemailer = require('nodemailer');


// Replace with your MongoDB connection string
const url = 'local';
const dbName = 'Users';
const collectionName = 'subscribers';

// Replace with your email credentials
const transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 465,
    secure: true,
    auth: {
        user: 'abcd@gmail.com',
        pass: 'abcd@1'
    },
    tls: {
        rejectUnauthorized: false
    },
});

// Replace with the API endpoint for weather data
const weatherApi = 'locals';

// Fetch the weather data from the API
const fetchWeatherData = async (query) => {
    const response = await axios.post(weatherApi, { query, count: 1000 });
    console.log('response --- ', response)
    return response.data;
}

// Send an email to the user with the weather data
const sendWeatherEmail = async (user) => {
    const weatherData = await fetchWeatherData(user.category);
    const mailOptions = {
        from: 'user@example.com',
        to: user.email,
        subject: 'Weather Report',
        text: `${JSON.stringify(weatherData, null, 4)}.`
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('error : transporter :', error);
        } else {
            console.log(`Email sent to ${user.email}`);
        }
    });
}

// Retrieve the users from the MongoDB collection and send them the weather data via email
const sendWeatherEmails = () => {
    MongoClient.connect(url, { useNewUrlParser: true }, (err, client) => {
        if (err) throw err;
        const db = client.db(dbName);
        db.collection(collectionName).find({ deletedAt: { $exists: false } }).toArray((err, users) => {
            if (err) throw err;
            users.forEach(user => {
                console.log('user - ', user)
                sendWeatherEmail(user);
            });
            client.close();
        });
    });
}

// Schedule the task to run every day at 9am
const job = new cron.CronJob('* */1 * * * *', sendWeatherEmails, null, true);
job.start();
