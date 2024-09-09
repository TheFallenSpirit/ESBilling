import dayjs from 'dayjs';
import Subscription, { SubscriptionI } from '../models/Subscription';
import { CustomData, WebhookPayload, Subscription as SubscriptionWebhook } from '../types';
import { getSubscription, redis, replacer } from '../store';
import { getForName } from '../helpers';
import config from '../config';

const resume = async (subscription: SubscriptionI, data: SubscriptionWebhook) => {
    const newSub = await Subscription.findByIdAndUpdate(subscription._id, {
        $unset: { endsAt: '' },
        $set: { status: 'active', renewsAt: dayjs.utc(data.attributes.renews_at).toDate() }
    }, { new: true });

    await redis.set(`es_subscription:${subscription.subscriberId}:${subscription._id}`, JSON.stringify(newSub?.toObject(), replacer));
    const forName = await getForName(subscription);

    const lines = [
        `Welcome back! Your ${data.attributes.product_name} subscription`,
        `${forName ? `for ${forName}` : ''} has been resumed.\n${config.manageMessage}`
    ];

    await redis.lpush(`es_queue:${process.env.BOT_ID}:billing`, JSON.stringify({
        force: true, user: subscription.subscriberId, content: { content: lines.join('') }
    }));
};

const cancel = async (subscription: SubscriptionI, data: SubscriptionWebhook) => {
    const newSub = await Subscription.findByIdAndUpdate(subscription._id, { $set: {
        status: 'cancelled',
        endsAt: dayjs.utc(data.attributes.ends_at).toDate()
    } }, { new: true })!;

    await redis.set(`es_subscription:${subscription.subscriberId}:${subscription._id}`, JSON.stringify(newSub?.toObject(), replacer));
    const forName = await getForName(subscription);

    const lines = [
        `We're sorry to see you go! Your ${data.attributes.product_name} subscription${forName ? ` for ${forName}` : ''}`,
        ` will end on ${dayjs.utc(data.attributes.ends_at).format('MMMM Do, YYYY')}.\n${config.feedbackMessage}`
    ];

    await redis.lpush(`es_queue:${process.env.BOT_ID}:billing`, JSON.stringify({
        force: true, user: subscription.subscriberId, content: { content: lines.join('') }
    }));
};

const renew = async (subscription: SubscriptionI, data: SubscriptionWebhook, renewsAt: Date) => {
    const newSub = await Subscription.findByIdAndUpdate(subscription._id, { $set: { renewsAt } }, { new: true });
    await redis.set(`es_subscription:${subscription.subscriberId}:${subscription._id}`, JSON.stringify(newSub?.toObject(), replacer));
    const forName = await getForName(subscription);

    const lines = [
        `Your ${data.attributes.product_name} subscription${forName ? `for ${forName}` : ''} has been renewed. `,
        `You will be charged next on ${dayjs.utc(newSub?.renewsAt).format('MMMM Do, YYYY')}.\n${config.manageMessage}`
    ];

    await redis.lpush(`es_subscription:${process.env.BOT_ID}:billing`, JSON.stringify({
        force: true, user: subscription.subscriberId, content: { content: lines.join('') }
    }));
};

export default async (body: WebhookPayload<CustomData>) => {
    const subscription = await getSubscription(body.meta.custom_data!.subscriber_id, body.data.id);
    if (!subscription) return;

    if (subscription.status !== body.data.attributes.status) switch (body.data.attributes.status) {
        case 'active': return resume(subscription, body.data);
        case 'cancelled': return cancel(subscription, body.data);
    };

    const renewsAt = dayjs.utc(body.data.attributes.renews_at).toDate();
    if (subscription.renewsAt !== renewsAt && body.data.attributes.status === 'active') return renew(subscription, body.data, renewsAt);
};
