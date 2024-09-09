import { SubscriptionI } from './models/Subscription';
import { redis } from './store';

const getChannelId = async (userId: string) => await fetch('https://discord.com/api/v10/users/@me/channels', {
    method: 'POST',
    body: JSON.stringify({ recipient_id: userId }),
    headers: { 'Content-Type': 'application/json', Authorization: `Bot ${process.env.BOT_TOKEN}` }
}).then(async (res) => await res.json()).then(async (body) => {
    await redis.set(`es_dm_channel:${userId}`, body.id);
    return body.id as string;
}).catch(() => null);

export const sendDM = async (userId: string, content: string) => {
    let channelId = await redis.get(`es_dm_channel:${userId}`);
    if (!channelId) channelId = await getChannelId(userId);
    if (!channelId) return false;

    return await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
        headers: { 'Content-Type': 'application/json',Authorization: `Bot ${process.env.BOT_TOKEN}` }
    }).then(() => true).catch(() => false);
};

interface User {
    id: string;
    username: string;
    global_name?: string;
}

export const getUser = async (userId: string) => await fetch(`https://discord.com/api/v10/users/${userId}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bot ${process.env.BOT_TOKEN}` }
}).then(async (res) => await res.json()).then((body) => body as User).catch(() => null);

interface Guild {
    id: string;
    name: string;
}

export const getGuild = async (guildId: string) => await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bot ${process.env.BOT_TOKEN}` }
}).then(async (res) => await res.json()).then((body) => body as Guild).catch(() => null);

export const getForName = async (subscription: SubscriptionI) => {
    if (subscription.activeUserId === subscription.subscriberId) return null;
    if (subscription.activeGuildId) return (await getGuild(subscription.activeGuildId))?.name || 'unknown server';

    if (subscription.activeUserId) {
        const user = await getUser(subscription.activeUserId);
        return user ? user.global_name ? `${user.global_name} (${user.username})` : user.username : 'unknown user';
    };

    return null;
};