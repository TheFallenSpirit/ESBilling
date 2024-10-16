import dayjs from 'dayjs';
import Subscription from '../models/Subscription';
import { CustomData, WebhookPayload } from '../types';
import { getSubscription, redis, replacer } from '../store';
import resume from './update/resume';
import cancel from './update/cancel';
import renew from './update/renew';
import expired from './update/expired';

export default async (body: WebhookPayload<CustomData>) => {
    let subscription = await getSubscription(body.meta.custom_data!.subscriber_id, body.data.id);
    if (!subscription) return;

    let newSub = null;
    if (subscription.status !== body.data.attributes.status) switch (body.data.attributes.status) {
        case 'expired': return await expired(subscription, body);
        case 'active': newSub = await resume(subscription, body); break;
        case 'cancelled': newSub = await cancel(subscription, body); break;
    };

    const renewsAt = !!body.data.attributes.renews_at ? dayjs.utc(body.data.attributes.renews_at).toDate() : null;
    if (renewsAt && (subscription.renewsAt !== renewsAt)) newSub = await renew(subscription, body, renewsAt);
    if (!newSub) newSub = await Subscription.findByIdAndUpdate(subscription._id, { $set: {
        renewsAt,
        status: body.data.attributes.status,
        planId: body.data.attributes.variant_id,
        planName: body.data.attributes.product_name,
    } }, { $new: true });

    await redis.set(`es_subscription:${subscription.subscriberId}:${subscription._id}`, JSON.stringify(newSub?.toObject(), replacer));
};
