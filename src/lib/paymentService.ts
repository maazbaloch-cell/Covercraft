import { createEasyPaisaCheckout, easyPaisaCancelled, easyPaisaOrderReference, easyPaisaSucceeded, type EasyPaisaFields, verifyEasyPaisaCallback } from "@/lib/easypaisa";

/** Gateway boundary: routes use this instead of containing provider-specific logic. */
export const paymentService = {
  initiate: createEasyPaisaCheckout,
  verifyCallback: verifyEasyPaisaCallback,
  orderReference: easyPaisaOrderReference,
  succeeded: easyPaisaSucceeded,
  cancelled: easyPaisaCancelled,
};

export function logPaymentEvent(event: string, fields: EasyPaisaFields) {
  const redacted = { ...fields };
  for (const key of ["merchantHashedReq", "merchantHashedResp", "merchantHashedResponse", "signature"]) {
    if (redacted[key]) redacted[key] = "[REDACTED]";
  }
  console.info(`[payment:easypaisa] ${event}`, redacted);
}
