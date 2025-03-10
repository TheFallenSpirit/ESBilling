import config from '../config';
import { getGuild, getUser } from '../helpers';
import Subscription, { SubscriptionI } from '../models/Subscription';
import { redis, replacer, updateGuild, updateProfile } from '../store';
import { CustomData, WebhookPayload } from '../types';
import dayjs from 'dayjs';

const benefitsTxt = 'Your premium benefits should be active shortly.';

export default async (body: WebhookPayload<CustomData>) => {
    let subscription: SubscriptionI | null = null;

    const subData = {
        status: 'active',
        _id: body.data.id,
        planId: body.data.attributes.variant_id,
        planName: body.data.attributes.product_name,
        subscriberId: body.meta.custom_data?.subscriber_id,
        renewsAt: dayjs.utc(body.data.attributes.renews_at).toDate()
    };

    if (body.meta.custom_data?.active_user_id) {
        const planName = body.data.attributes.product_name;
        subscription = (await Subscription.create({ ...subData, activeUserId: body.meta.custom_data.active_user_id })).toObject();

        if (subscription.activeUserId === subscription.subscriberId) await redis.lpush(`es_queue:${process.env.BOT_ID}:billing`, JSON.stringify({
            force: true, user: subscription.subscriberId,
            content: { content: `:tada: Thank you for subscribing to ${planName}! ${benefitsTxt} ${config.manageMessage}` }
        })); else {
            let activeName = 'unknown user';
            const activeUser = await getUser(subscription.activeUserId!);
            if (activeUser) activeName = activeUser.global_name ? `${activeUser.global_name} (${activeUser.username})` : activeUser.username;

            const lines = [
                `:tada: Thank you for gifting ${planName}! `,
                `Your gift to ${activeName} has been added to your subscriptions. ${config.manageMessage}`
            ];

            await redis.lpush(`es_queue:${process.env.BOT_ID}:billing`, JSON.stringify({
                force: true, user: subscription.subscriberId, content: { content: lines.join('') }
            }));

            let gifterName = 'unknown user';
            const gifterUser = await getUser(subscription.subscriberId);
            if (gifterUser) gifterName = gifterUser.global_name ? `${gifterUser.global_name} (${gifterUser.username})` : gifterUser.username;
            
            await redis.lpush(`es_queue:${process.env.BOT_ID}:billing`, JSON.stringify({
                force: true, user: subscription.activeUserId,
                content: { content: `:tada: You have been gifted ${planName} by ${gifterName}! ${benefitsTxt}` }
            }));
        };

        await updateProfile(subscription.activeUserId!, { $set: { premiumTier: config.userPlanTiers[body.data.attributes.variant_id] } });
    } else if (body.meta.custom_data?.active_guild_id) {
        subscription = (await Subscription.create({ ...subData, activeGuildId: body.meta.custom_data.active_guild_id })).toObject();
        await updateGuild(subscription.activeGuildId!, { premiumTier: config.guildPlanTiers[body.data.attributes.variant_id] });
        const guild = await getGuild(subscription.activeGuildId!);
        const guildName = guild?.name || 'unknown server';

        const lines = [
            `:tada: Thank you for subscribing to ${body.data.attributes.product_name}! `,
            `Your premium benefits for ${guildName} should be active shortly. ${config.manageMessage}`
        ];

        await redis.lpush(`es_queue:${process.env.BOT_ID}:billing`, JSON.stringify({
            force: true, user: subscription.subscriberId, content: { content: lines.join('') }
        }));
    };

    await redis.set(`es_subscription:${body.meta.custom_data!.subscriber_id}:${subscription!._id}`, JSON.stringify(subscription, replacer));
    await redis.sadd(`es_subscriptions:${body.meta.custom_data!.subscriber_id}`, `es_subscription:${body.meta.custom_data!.subscriber_id}:${subscription!._id}`);
};
