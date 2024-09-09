import Redis from 'ioredis';
import { UpdateQuery } from 'mongoose';
import Profile, { ProfileI } from './models/Profile';
import Guild, { GuildI } from './models/Guild';
import Subscription, { SubscriptionI } from './models/Subscription';
import dayjs from 'dayjs';

export const redis = new Redis(process.env.REDIS_URL!);

export const replacer = (key: string, value: any) => {
    if (typeof value === 'bigint') return value.toString();
    if (value instanceof Map) return { dataType: 'Map', value: [...value]};
    return value;
};

export const reviver = (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') return new Map(value.value);
    }
    return value;
};

export const updateProfile = async (userId: string, query: UpdateQuery<ProfileI>) => {
    const profile = await Profile.findOneAndUpdate({ user: userId }, query, { new: true });
    if (!profile) throw new Error('The specified profile does not exist.');
    await redis.set(`es_profile:${profile.user}`, JSON.stringify(profile.toObject(), replacer));
    return profile.toObject();
};

export const updateGuild = async (guildId: string, query: UpdateQuery<GuildI>) => {
    const guild = await Guild.findOneAndUpdate({ guild: guildId }, query, { new: true });
    if (!guild) throw new Error('The specified guild does not exist.');
    await redis.set(`es_guild:${guild.guild}`, JSON.stringify(guild.toObject(), replacer));
    return guild.toObject();
};

export const getSubscription = async (userId: string, subId: string) => {
    const redisSubscription = await redis.get(`es_subscription:${userId}:${subId}`);
    const cachedSubscription: SubscriptionI|null = redisSubscription ? JSON.parse(redisSubscription, reviver) : null;
    if (cachedSubscription) return cachedSubscription;
    if (await redis.exists(`es_cooldown_timed:fetch-subscription:${subId}`)) return null;

    const dbSubscription = await Subscription.findById(subId);
    if (dbSubscription) {
        await redis.set(`es_subscription:${subId}`, JSON.stringify(dbSubscription.toObject(), replacer));
        return dbSubscription.toObject();
    } else await redis.set(`es_cooldown_timed:fetch-subscription:${subId}`, dayjs.utc().add(2, 'weeks').toISOString());

    return null;
};

