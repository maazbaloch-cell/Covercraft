# TCS courier setup for this shop

This website is ready to store TCS consignment numbers and show courier tracking on the customer tracking page. The shop owner must complete the steps below before live tracking can work.

## 1. Get a TCS merchant account

Create a TCS e-commerce/COD merchant account. Ask TCS to enable all of the following for a custom website:

- Tracking API
- COD / shipment-booking API
- Webhooks
- Sandbox or test credentials
- Production credentials

Ask TCS for their API documentation, endpoint URLs, authentication requirements, request/response samples, and webhook signature-verification instructions.

TCS developer portal: <https://developer.tcscourier.com/doc>

## 2. Add TCS credentials to the server

Never put API credentials in frontend code or share them with customers. Add them only to the server environment file (`.env` locally, or your hosting provider's environment-variable settings).

```env
# Replace each value with the exact value supplied by TCS.
# The URL may contain {trackingNumber}; the shop replaces it with the TCS CN number.
TCS_TRACKING_API_URL="https://TCS-TRACKING-ENDPOINT/{trackingNumber}"
TCS_TRACKING_API_TOKEN="TCS_TOKEN_IF_PROVIDED"

# Add only the headers required by TCS. Example only:
TCS_TRACKING_API_HEADERS='{"X-Api-Key":"TCS_API_KEY"}'
```

If TCS requires an API key, subscription key, username/password, HMAC signature, or another header format, use its documentation. Do not guess names or values.

## 3. Shipment workflow

Until the TCS booking API has been connected using TCS's exact documentation, book each shipment in the TCS merchant portal:

1. Customer places an order in this shop.
2. Create the shipment in the TCS merchant portal.
3. TCS provides a CN / consignment / tracking number.
4. Open this site's **Admin Dashboard**.
5. Find the order, choose **TCS**, paste the CN number, and click **Save shipment**.
6. The order changes to `SHIPPED`.
7. The customer goes to `/track`, enters the shop order number (for example `MBC-12345`), and sees the saved TCS consignment number plus live events when the Tracking API is configured.

The shop order number and TCS CN number are different. Customers enter the shop order number; the server uses the saved CN number to query TCS securely.

## 4. Final automation after receiving TCS documentation

Give the TCS COD API and Webhook documentation to the developer. The final connection should:

1. Send the paid/COD order, recipient address, phone number, amount, weight, and pickup details to the TCS booking API.
2. Read the CN number from TCS's booking response and save it automatically against the order.
3. Verify incoming TCS webhook signatures.
4. Save courier scan events and update order statuses automatically (`SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, or `CANCELLED`).
5. Test with a TCS sandbox shipment before using production credentials.

## Test checklist

- [ ] TCS merchant account is active.
- [ ] Tracking API credentials are added to the server environment.
- [ ] The server has been restarted or redeployed after adding environment variables.
- [ ] A real or sandbox TCS CN is assigned to a test order in Admin Dashboard.
- [ ] `/track` displays the order and its TCS tracking information.
- [ ] The API key and token do not appear in browser code, git commits, screenshots, or customer pages.
