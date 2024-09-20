import { getForName } from '../helpers';
import { getSubscription, redis } from '../store';
import { CustomData, WebhookPayload } from '../types';

export default async (body: WebhookPayload<CustomData>) => {
    let subscription = await getSubscription(body.meta.custom_data!.subscriber_id, body.data.attributes.subscription_id!.toString());
    if (!subscription) return;

    const forName = await getForName(subscription);

    const lines = [
        `Hey there! Just wanted to let you know that we were unable to charge your payment method`,
        ` for your ${subscription.planName} subscription${forName ? ` for ${forName}` : ''}. `,
        'You can update your payment method by selecting this subscription in the </home:1275068280955998299> panel.'
    ];

    await redis.lpush(`es_queue:${process.env.BOT_ID}:billing`, JSON.stringify({
        force: true, user: subscription.subscriberId, content: { content: lines.join('') }
    }));
};
