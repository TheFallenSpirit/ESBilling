export interface CustomData {
    plan_tier: string;
    subscriber_id: string;
    active_user_id?: string;
    active_guild_id?: string;
}

type SubscriptionEventNames =
    | 'subscription_created'
    | 'subscription_cancelled'
    | 'subscription_resumed'
    | 'subscription_updated'
    | 'subscription_expired'
    | 'subscription_paused'
    | 'subscription_unpaused'
    | 'subscription_payment_success'
    | 'subscription_payment_failed'
    | 'subscription_payment_recovered';

export type WebhookPayload<CustomData = any> = {
    meta: {
        event_name: SubscriptionEventNames;
        custom_data?: CustomData;
    };
    data: Subscription;
};

export type Subscription = {
    type: 'subscriptions';
    id: string;
    attributes: {
        store_id: number;
        order_id: number;
        customer_id: number;
        order_item_id: number;
        product_id: number;
        variant_id: number;
        product_name: string;
        variant_name: string;
        user_name: string;
        user_email: string;
        status: SubscriptionStatus;
        status_formatted: string;
        pause: any | null;
        cancelled: boolean;
        trial_ends_at: string | null;
        billing_anchor: number;
        urls: {
            update_payment_method: string;
        };
        renews_at: string;
        ends_at: string | null;
        created_at: string;
        updated_at: string;
        test_mode: boolean;
        subscription_id?: number;
    };
};

type SubscriptionStatus = 'on_trial' | 'active' | 'paused' | 'past_due' | 'unpaid' | 'cancelled' | 'expired';
