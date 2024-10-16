import bodyParser from 'body-parser';
import express from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { CustomData, WebhookPayload } from './types';
import dayjs from 'dayjs';
import utcPlugin from 'dayjs/plugin/utc.js';
import advancedFormatPlugin from 'dayjs/plugin/advancedFormat.js';
import { connect } from 'mongoose';
import subscriptionUpdated from './events/updated';
import subscriptionCreated from './events/created';
import subscriptionExpired from './events/update/expired';
import paymentFail from './events/paymentFail';
import paymentSuccess from './events/paymentSuccess';

if (!process.env.BOT_ID || !process.env.LS_SECRET || !process.env.BOT_TOKEN || !process.env.MONGO_URL || !process.env.REDIS_URL) {
    console.error('[ENV] Please specify BOT_ID, LS_SECRET, BOT_TOKEN, MONGO_URL, and REDIS_URL environment variables!');
    process.exit(1);
};

const dev = process.argv.includes('--dev');
dayjs.extend(utcPlugin);
dayjs.extend(advancedFormatPlugin);

const app = express();
await connect(process.env.MONGO_URL, { dbName: dev ? 'dev' : 'bot' }).then(() => {
    console.log('[DATABASE] Successfully connected to MongoDB.');
}).catch(() => console.log('[DATABASE] Failed to connect to MongoDB.'));

app.get('/health', (req, res) => {
    res.status(200).send({ status: 'online' });
});

app.post('/', bodyParser.raw({ type: 'application/json' }), async (req, res) => {
    if (!req.body || typeof req.body !== 'object' || Object.entries(req.body).length < 1)
        return res.status(401).send({ error: 'Invalid request body provided.' });

    const hmac = createHmac('sha256', process.env.LS_SECRET!);
    const digest = Buffer.from(hmac.update(req.body).digest('hex'), 'utf-8');
    const signature = Buffer.from(typeof req.headers['x-signature'] === 'string' ? req.headers['x-signature'] : '', 'utf-8');
    if (digest.length !== signature.length || !timingSafeEqual(digest, signature))
        return res.status(401).send({ error: 'Invalid "X-Signature" header provided.' });

    const body: WebhookPayload<CustomData> = JSON.parse(req.body.toString());

    switch (body.meta.event_name) {
        case 'subscription_created': await subscriptionCreated(body); break;
        case 'subscription_updated': await subscriptionUpdated(body); break;
        // case 'subscription_expired': await subscriptionExpired(body); break;
        case 'subscription_payment_failed': await paymentFail(body); break;
        case 'subscription_payment_success': await paymentSuccess(body); break;
    };

    return res.status(201).send();
});

app.listen(3000, '0.0.0.0');
console.log('[SERVER] Listening for requests on http://0.0.0.0:3000.');
