import dayjs from 'dayjs';
import { getForName } from '../../helpers';
import Subscription, { SubscriptionI } from '../../models/Subscription';
import config from '../../config';
import { getSubscription, redis } from '../../store';
import { CustomData, WebhookPayload } from '../../types';

export default async (body: WebhookPayload<CustomData>) => {
    const subscription = await getSubscription(body.meta.custom_data?.subscriber_id!, body.data.id);
    if (!subscription) return;
    
    const forName = await getForName(subscription);

    const lines = [
        `:sob: We're sorry to see you go! Your ${body.data.attributes.product_name} subscription${forName ? ` for ${forName}` : ''} will end`,
        ` on ${dayjs.utc(body.data.attributes.ends_at).format('MMMM Do, YYYY')}, and you will no longer be charged.\n${config.feedbackMessage}`
    ];

    await redis.lpush(`es_queue:${process.env.BOT_ID}:billing`, JSON.stringify({
        force: true, user: subscription.subscriberId, content: { content: lines.join('') }
    }));

    return await Subscription.findByIdAndUpdate(subscription._id, { $set: {
        status: 'cancelled',
        endsAt: dayjs.utc(body.data.attributes.ends_at).toDate()
    } }, { new: true });
};
