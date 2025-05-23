import { getForName, getUser } from '../../helpers';
import Subscription from '../../models/Subscription';
import { getSubscription, redis, updateGuild, updateProfile } from '../../store';
import { CustomData, WebhookPayload } from '../../types';

export default async (body: WebhookPayload<CustomData>) => {
    const subscription = await getSubscription(body.meta.custom_data?.subscriber_id!, body.data.id);
    if (!subscription) return;

    if (subscription.activeUserId) {
        await updateProfile(subscription.activeUserId, { $set: { premiumTier: 0 } }).catch(() => {});
        if (subscription.activeUserId !== subscription.subscriberId) {
            let gifterName = 'unknown user';
            const gifterUser = await getUser(subscription.subscriberId);
            if (gifterUser) gifterName = gifterUser.global_name ? `${gifterUser.global_name} (${gifterUser.username})` : gifterUser.username;

            await redis.lpush(`es_queue:${process.env.BOT_ID}:billing`, JSON.stringify({
                force: true, user: subscription.activeUserId,
                content: { content: `Your ${body.data.attributes.product_name} benefits have ended because your gift from ${gifterName} expired.` }
            }));
        };
    } else if (subscription.activeGuildId) await updateGuild(subscription.activeGuildId, { $set: { premiumTier: 0 } });

    await Subscription.findByIdAndDelete(subscription._id);
    await redis.del(`es_subscription:${subscription.subscriberId}:${subscription._id}`);
    await redis.srem(`es_subscriptions:${subscription.subscriberId}`, `es_subscription:${subscription.subscriberId}:${subscription._id}`);
    const forName = await getForName(subscription);
    
    const lines = [
        `Your ${body.data.attributes.product_name} subscription${forName ? ` for ${forName}` : ''} has expired.`,
        ` It will be removed from your subscriptions, and ${forName ? `${forName}'s` : 'your'} premium benefits are no longer active.`
    ];

    await redis.lpush(`es_queue:${process.env.BOT_ID}:billing`, JSON.stringify({
        force: true, user: subscription.subscriberId, content: { content: lines.join('') }
    }));
};
