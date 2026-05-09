export interface OrderOffer {
    id: number;
    order_id: number;
    business_name: string;
    business_address: string | null;
    delivery_address: string | null;
    order_total: string;
    distance_km: string;
    estimated_time_minutes: number | null;
    created_at: string;
    expires_at: string;
    time_remaining: number;
}
