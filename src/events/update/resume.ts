import dayjs from 'dayjs';
import { getForName } from '../../helpers';
import Subscription, { SubscriptionI } from '../../models/Subscription';
import { redis } from '../../store';
import config from '../../config';
import { CustomData, WebhookPayload } from '../../types';

export default async (subscription: SubscriptionI, body: WebhookPayload<CustomData>) => {
    const forName = await getForName(subscription);

    const lines = [
        `Welcome back to ${body.data.attributes.product_name}! Your ${body.data.attributes.product_name} `,
        `subscription ${forName ? `for ${forName}` : ''} has been resumed.\n${config.manageMessage}`
    ];

    await redis.lpush(`es_queue:${process.env.BOT_ID}:billing`, JSON.stringify({
        force: true, user: subscription.subscriberId, content: { content: lines.join('') }
    }));

    return await Subscription.findByIdAndUpdate(subscription._id, {
        $unset: { endsAt: '' },
        $set: { status: 'active', renewsAt: dayjs.utc(body.data.attributes.renews_at).toDate() }
    }, { new: true });
};
