// This is not the full ES guild schema, only a cut down version of it.

import { model, Schema } from 'mongoose';

interface SafetySubscriptionI {
    autoBan: boolean;
    alertsChannel: string;
    customContent?: string;
};

export interface GuildI {
    guild: string;
    premiumTier: number;
    advancedPermissions: Map<string, string[]>;
    safetySubscriptions: Map<string, SafetySubscriptionI>;
};

// prettier-ignore
const safetySubscriptionSchema = new Schema<SafetySubscriptionI>({
    autoBan: { required: true, type: Boolean },
    alertsChannel: { required: true, type: String },
    customContent: { required: false, type: String }
}, { _id: false, versionKey: false });

// prettier-ignore
const guildSchema = new Schema<GuildI>({
    guild: { required: true, type: String },
    premiumTier: { required: true, type: Number, default: 0 },
    safetySubscriptions: { required: true, type: Map, of: safetySubscriptionSchema, default: new Map() },
    advancedPermissions: { required: true, type: Map, of: [String], default: new Map() },
}, { _id: false, versionKey: false, timestamps: true });

export default model('guilds', guildSchema);
