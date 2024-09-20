import dayjs from 'dayjs';
import { getForName } from '../../helpers';
import Subscription, { SubscriptionI } from '../../models/Subscription';
import config from '../../config';
import { redis } from '../../store';
import { CustomData, WebhookPayload } from '../../types';

export default async (subscription: SubscriptionI, body: WebhookPayload<CustomData>, renewsAt: Date) => {
    const forName = await getForName(subscription);

    const lines = [
        `Your ${body.data.attributes.product_name} subscription${forName ? ` for ${forName}` : ''} has been renewed.`,
        ` You will be charged next on ${dayjs.utc(renewsAt).format('MMMM Do, YYYY')}. ${config.manageMessage}`
    ];

    await redis.lpush(`es_subscription:${process.env.BOT_ID}:billing`, JSON.stringify({
        force: true, user: subscription.subscriberId, content: { content: lines.join('') }
    }));

    return await Subscription.findByIdAndUpdate(subscription._id, { $set: { renewsAt } }, { new: true });
};
