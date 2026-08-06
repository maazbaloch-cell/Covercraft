export type Courier = "TCS" | "LEOPARDS";

export type CourierTracking = {
  courier: Courier;
  trackingNumber: string;
  status?: string;
  location?: string;
  updatedAt?: string;
  events: Array<{ status: string; location?: string; note?: string; occurredAt?: string }>;
  configured: boolean;
  message?: string;
};

const configFor = (courier: Courier) => {
  const prefix = courier === "TCS" ? "TCS" : "LEOPARDS";
  return {
    url: process.env[`${prefix}_TRACKING_API_URL`],
    token: process.env[`${prefix}_TRACKING_API_TOKEN`],
    headers: process.env[`${prefix}_TRACKING_API_HEADERS`],
  };
};

// Couriers issue merchant-specific API credentials and sometimes different response shapes.
// Set the URL as an exact endpoint, using {trackingNumber} where the consignment number belongs.
export async function getCourierTracking(courier: Courier, trackingNumber: string): Promise<CourierTracking> {
  const config = configFor(courier);
  if (!config.url) {
    return { courier, trackingNumber, events: [], configured: false, message: "Live courier tracking is not connected yet." };
  }

  const url = config.url.includes("{trackingNumber}")
    ? config.url.replace("{trackingNumber}", encodeURIComponent(trackingNumber))
    : `${config.url}${config.url.includes("?") ? "&" : "?"}trackingNumber=${encodeURIComponent(trackingNumber)}`;

  try {
    let configuredHeaders: Record<string, string> = {};
    if (config.headers) {
      try { configuredHeaders = JSON.parse(config.headers) as Record<string, string>; } catch { /* Invalid optional headers are ignored. */ }
    }
    const response = await fetch(url, {
      headers: { Accept: "application/json", ...configuredHeaders, ...(config.token ? { Authorization: `Bearer ${config.token}` } : {}) },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return { courier, trackingNumber, events: [], configured: true, message: "Courier tracking is temporarily unavailable." };

    const payload = await response.json() as Record<string, unknown>;
    const sourceEvents = Array.isArray(payload.events) ? payload.events : Array.isArray(payload.history) ? payload.history : Array.isArray(payload.data) ? payload.data : [];
    const events = sourceEvents.map((event: any) => ({
      status: String(event.status ?? event.activity ?? event.description ?? "Update"),
      location: event.location ?? event.city ?? event.currentLocation,
      note: event.note ?? event.remarks,
      occurredAt: event.occurredAt ?? event.date ?? event.timestamp ?? event.createdAt,
    }));
    return {
      courier,
      trackingNumber,
      status: typeof payload.status === "string" ? payload.status : undefined,
      location: typeof payload.location === "string" ? payload.location : undefined,
      updatedAt: typeof payload.updatedAt === "string" ? payload.updatedAt : undefined,
      events,
      configured: true,
    };
  } catch {
    return { courier, trackingNumber, events: [], configured: true, message: "Courier tracking could not be reached." };
  }
}
