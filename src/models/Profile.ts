// This is not the full ES profile schema, only a cut down version of it.

import { model, Schema } from 'mongoose';

export interface ProfileI {
    user: string;
    premiumTier: number;
};

// prettier-ignore
const profileSchema = new Schema<ProfileI>({
    user: { required: true, type: String },
    premiumTier: { required: true, type: Number, default: 0 }
}, { _id: false, versionKey: false, timestamps: true });

export default model('profiles', profileSchema);
