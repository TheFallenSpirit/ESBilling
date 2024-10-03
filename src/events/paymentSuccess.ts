import Subscription from '../models/Subscription';
import { redis, replacer } from '../store';
import { CustomData, WebhookPayload } from '../types';

export default async (body: WebhookPayload<CustomData>) => {
    setTimeout(async () => {
        const subscription = await Subscription.findOneAndUpdate(
            { _id: body.data.attributes.subscription_id! },
            { planPrice: (body.data.attributes.total_usd! / 100).toFixed(2) },
            { new: true }
        );
    
        if (subscription) await redis.set(
            `es_subscription:${body.meta.custom_data?.subscriber_id}:${body.data.attributes.subscription_id}`,
            JSON.stringify(subscription.toObject(), replacer)
        );
    }, 10000);
};
