import { Schema, model } from 'mongoose';
import { SubscriptionStatus } from 'src/types';

export interface SubscriptionI {
    _id: string;
    endsAt?: Date;
	renewsAt: Date;
	planId: number;
    subscriberId: string;
	activeUserId?: string;
	activeGuildId?: string;
	status: SubscriptionStatus;
}

// prettier-ignore
const subscriptionSchema = new Schema<SubscriptionI>({
    _id: { required: true, type: String },
    status: { required: true, type: String },
    planId: { required: true, type: Number },
    subscriberId: { required: true, type: String },
    activeUserId: { required: false, type: String },
    activeGuildId: { required: false, type: String },
    endsAt: { required: false, type: Date },
    renewsAt: { required: false, type: Date }
}, { _id: false, versionKey: false, timestamps: true });

export default model('subscriptions', subscriptionSchema);
