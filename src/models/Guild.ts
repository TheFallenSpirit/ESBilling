// This is not the full ES guild schema, only a cut down version of it.

import { model, Schema } from 'mongoose';

export interface GuildI {
    guild: string;
    premiumTier: number;
};

// prettier-ignore
const guildSchema = new Schema<GuildI>({
    guild: { required: true, type: String },
    premiumTier: { required: true, type: Number, default: 0 }
}, { _id: false, versionKey: false, timestamps: true });

export default model('guilds', guildSchema);
