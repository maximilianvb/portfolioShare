const user_data = require('./account_data_handler.js');

require('dotenv').config();
const cookieParser = require('cookie-parser');
const express = require('express');
const app = express();
const cors = require('cors');
const crypto = require('crypto');
const MongoClient = require('mongodb').MongoClient;
app.use(cors({credentials: true, origin:'http://localhost:3000'}));
app.use(cookieParser(process.env.COOKIE_SECRET));

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const PORT = process.env.PORT_SERVER || 5000;

const path = require('path');
const util = require('util');

const plaid = require('plaid');
const plaidClient = new plaid.Client({
    clientID: process.env.PLAID_CLIENT_ID,
    secret: process.env.PLAID_SECRET,
    env: plaid.environments.sandbox,
});


app.get('/create-link-token', async (req, res) => {
    const { link_token: linkToken } = await plaidClient.createLinkToken({
        user: {
            client_user_id: 'unique-id',
        },
        client_name: 'App of Max',
        products: ['auth', 'investments', 'identity'],
        country_codes: ['US'],
        language: 'en'
    });
    console.log('Sent the link token');
    res.json({ linkToken });
});

app.post('/token-exchange', async (req, res) => {
    const dbClient = new MongoClient(process.env.MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
    await dbClient.connect();
    const users_data = dbClient.db("flexport").collection("userData");

    console.log('Executing exchange');
    const { publicToken } = req.body;
    const { access_token: accessToken } = await plaidClient.exchangePublicToken(publicToken);

    const identityResponse = await plaidClient.getIdentity(accessToken);
    const holdingsResponse = await plaidClient.getHoldings(accessToken);
    responses = {'Identity': identityResponse, 'Holdings': holdingsResponse};
    let data = new user_data.UserData(responses);

    let accessId = crypto.randomBytes(20).toString('hex');

    let check =  users_data.find({ 'available_accounts': data.availableAccounts } );
    const matches = await check.toArray();
    let username_set = false;
    let username = '';
    // rework this like the username_check you lazy fuck
    if (matches.length == 0) {
        console.log('New user!');
        // for testing creating new accounts I need to disable this code
        await users_data.insertOne( { access_id : accessId, token : accessToken, 'available_accounts': data.availableAccounts, 'Identity': identityResponse, 'Holdings': holdingsResponse} );
    };
    if (matches.length == 1) {
        console.log('Welcome back, updating your info!');
        await users_data.updateOne({ '_id': matches[0]._id }, {$set: {  access_id : accessId, token : accessToken, 'available_accounts': data.availableAccounts, 'Identity': identityResponse, 'Holdings': holdingsResponse}});
        username = matches[0].username;
        if (username != undefined)
            username_set = true;
    };
    dbClient.close();

    res.cookie('access', accessId, {secure:true, sameSite:'None', httpOnly:false});
    if (username_set) {
        res.cookie('username', username, {secure:true, sameSite:'None', httpOnly:false});
    } else {
        res.cookie('username', 'unset', {secure:true, sameSite:'None', httpOnly:false});
    }
   res.sendStatus(200);
});

app.post('/username_check', async(req, res) => {
    let result = 'false';
    let username = req.body.username;
    const dbClient = new MongoClient(process.env.MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
    // make connecting a function or make it global or something?
    await dbClient.connect();
    const users_data = dbClient.db("flexport").collection("userData");
    let check = await users_data.find({ 'username': username } ).limit(1).count() == 0;
    if (check) {
        result = true;
    };
    res.status(200).send({'result': result});
})

app.post('/accounts_available', async(req, res) => {
    console.log('Sending available accounts to frontend'); 
    console.log(req.body);
    res.json('cock');
});



app.listen(PORT, () => {
    console.log('listening on port: ', PORT);
});