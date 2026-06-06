// Central registry of query keys so cache lookups and invalidations stay
// consistent as the app grows. Invalidate broad prefixes (e.g. ["orders"]) to
// refresh related queries together.
export const queryKeys = {
    me: ["me"] as const,
    orders: {
        all: ["orders"] as const,
        active: ["orders", "active"] as const,
        history: ["orders", "history"] as const,
    },
    availability: ["driver", "availability"] as const,
    order: (id: number) => ["order", id] as const,
    business: (id: number) => ["business", id] as const,
    userPublic: (id: number) => ["user", id, "public"] as const,
};
