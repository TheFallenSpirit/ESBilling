import dayjs from 'dayjs';
import { getForName } from '../../helpers';
import Subscription from '../../models/Subscription';
import { getSubscription, redis } from '../../store';
import config from '../../config';
import { CustomData, WebhookPayload } from '../../types';

export default async (body: WebhookPayload<CustomData>) => {
    const subscription = await getSubscription(body.meta.custom_data?.subscriber_id!, body.data.id);
    if (!subscription) return;

    const forName = await getForName(subscription);

    const lines = [
        `Welcome back to ${body.data.attributes.product_name}! Your ${body.data.attributes.product_name} `,
        `subscription${forName ? ` for ${forName}` : ''} has been resumed. ${config.manageMessage}`
    ];

    await redis.lpush(`es_queue:${process.env.BOT_ID}:billing`, JSON.stringify({
        force: true, user: subscription.subscriberId, content: { content: lines.join('') }
    }));

    return await Subscription.findByIdAndUpdate(subscription._id, {
        $unset: { endsAt: '' },
        $set: { status: 'active', renewsAt: dayjs.utc(body.data.attributes.renews_at).toDate() }
    }, { new: true });
};
