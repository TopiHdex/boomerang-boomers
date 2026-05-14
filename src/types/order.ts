export type OrderStatus = "EE" | "CO" | "EP" | "ER" | "T" | "N";

export interface OrderItemProduct {
    id: number;
    name: string;
    price: string;
}

export interface OrderItem {
    id: number;
    quantity: number;
    order: number;
    product: OrderItemProduct;
}

export interface OrderStatusLog {
    id: number;
    created_at: string;
    status: OrderStatus;
    order: number;
}

export interface Order {
    id: number;
    order_items: OrderItem[];
    status_logs: OrderStatusLog[];
    created_at: string;
    status: OrderStatus;
    total: string;
    client: number;
    business: number;
    deliver?: number | null;
}

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
