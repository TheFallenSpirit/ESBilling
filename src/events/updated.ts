import dayjs from 'dayjs';
import Subscription from '../models/Subscription';
import { CustomData, WebhookPayload } from '../types';
import { getSubscription, redis, replacer } from '../store';
import renew from './update/renew';
import expired from './update/expired';

export default async (body: WebhookPayload<CustomData>) => {
    let subscription = await getSubscription(body.meta.custom_data!.subscriber_id, body.data.id);
    if (!subscription) return;

    if (body.data.attributes.status === 'unpaid') return await expired(body);

    let newSub = null;
    const renewsAt = dayjs.utc(body.data.attributes.renews_at);
    if (body.data.attributes.status === 'active' && !renewsAt.isSame(subscription.renewsAt)) {
        newSub = await renew(subscription, body, renewsAt.toDate());
    };

    if (!newSub && !['expired', 'unpaid'].includes(subscription.status)) {
        newSub = await Subscription.findByIdAndUpdate(subscription._id, { $set: {
            renewsAt: renewsAt.toDate(),
            status: body.data.attributes.status,
            planId: body.data.attributes.variant_id,
            planName: body.data.attributes.product_name,
        } }, { $new: true });
    };

    await redis.set(`es_subscription:${subscription.subscriberId}:${subscription._id}`, JSON.stringify(newSub?.toObject(), replacer));
};
