// This is not the full ES profile schema, only a cut down version of it.

import { model, Schema } from 'mongoose';

export interface BindI {
	channel: string;
	roles?: string[];
}

export interface ChastityI {
	role?: string;
	channels?: string[];
}

interface ImpairmentsI {
	roleplayEnabled: boolean;
	roleplayOverrides: Map<string, boolean>;
}

export interface ProfileI {
    user: string;
    premiumTier: number;
    binds: Map<string, BindI>;
    statistics: Map<string, number>;
    chastity: Map<string, ChastityI>;
    impairmentsConfig: ImpairmentsI;
};

// prettier-ignore
const bindSchema = new Schema<BindI>({
	channel: { required: true, type: String },
	roles: { required: false, type: [String] }
}, { _id: false, versionKey: false });

// prettier-ignore
const chastitySchema = new Schema<ChastityI>({
	role: { required: false, type: String },
	channels: { required: false, type: [String] }
}, { _id: false, versionKey: false });

// prettier-ignore
const profileSchema = new Schema<ProfileI>({
    user: { required: true, type: String },
    premiumTier: { required: true, type: Number, default: 0 },
    binds: { required: true, type: Map, of: bindSchema, default: new Map() },
    chastity: { required: true, type: Map, of: chastitySchema, default: new Map() },
    impairmentsConfig: {
		roleplayEnabled: { required: true, type: Boolean, default: false },
		roleplayOverrides: { required: true, type: Map, of: Boolean, default: new Map() }
	},
	statistics: { required: true, type: Map, of: Number, default: new Map() }
}, { _id: false, versionKey: false, timestamps: true });

export default model('profiles', profileSchema);
