# First-Time Customer Discount & Loyalty Features

## Overview
This document describes the implementation of two key features for the multi-tenant SaaS backend:
1. First-time customer discount on redeemable products
2. Automatic loyalty increment when purchasing redeemable products

## Features Implemented

### 1. First-Time Customer Discount

**Behavior:**
- When a new customer (user with no previous successful transactions) places an order containing redeemable products, they receive a discount on **redeemable products only** (regular products are not discounted)
- The discount is applied only on the first order; subsequent orders do not receive this discount
- Discount percentage is configurable via environment variable `FIRST_TIME_CUSTOMER_DISCOUNT_PERCENT` (default: 10%)

**Implementation Details:**
- **Location:** `backend/src/routes/payments.ts`
- **Check:** Queries `Transaction` collection for previous successful transactions with the same `userId` and `tenantId`
- **Discount Application:** Only applied to products where `isRedeemable === true`
- **Metadata Stored:**
  - `isFirstTimeCustomer`: boolean flag
  - `discountPercent`: percentage applied
  - `originalAmount`: total before discount
  - `discountedAmount`: total after discount
  - `totalDiscountAmount`: total discount applied

### 2. Loyalty Points Increment

**Behavior:**
- When a purchase is completed (payment succeeds) and the order contains **any redeemable products**, the user's loyalty purchase count increments by 1
- This happens automatically regardless of whether the user is enrolled in the loyalty program
- The increment occurs in the webhook handler when `payment_intent.succeeded` event is received

**Implementation Details:**
- **Location:** `backend/src/routes/stripeWebhook.ts`
- **Check:** Verifies `hasRedeemableProducts === 'true'` in payment intent metadata
- **Action:** Calls `incrementLoyaltyPurchase(userId, tenantId)` if:
  - `userId` is present in metadata
  - Order contains redeemable products (`hasRedeemableProducts === 'true'`)

## Database Schema Changes

### Product Model
Added field:
- `isRedeemable: boolean` (default: `false`, indexed)
  - Marks products that are eligible for first-time discounts and loyalty tracking

### Transaction Metadata
Enhanced metadata includes:
- `hasRedeemableProducts`: string ('true'/'false')
- `isFirstTimeCustomer`: string ('true'/'false')
- `discountPercent`: string (percentage as string)
- `originalAmount`: string (amount before discount in cents)
- `discountedAmount`: string (amount after discount in cents)
- `totalDiscountAmount`: string (total discount in cents)

## Configuration

### Environment Variables
- `FIRST_TIME_CUSTOMER_DISCOUNT_PERCENT`: Discount percentage for first-time customers (default: 10)

### Example `.env`:
```env
FIRST_TIME_CUSTOMER_DISCOUNT_PERCENT=15
```

## Security & Multi-Tenancy

### Tenant Isolation
- All queries are scoped by `tenantId` to ensure proper tenant isolation
- First-time customer check only considers transactions within the same tenant
- Loyalty increments are tenant-specific

### Data Integrity
- Discount calculations are performed server-side to prevent manipulation
- Transaction metadata is stored for audit purposes
- All amounts are calculated in cents to avoid floating-point errors

## Flow Diagram

### First-Time Customer Discount Flow
```
1. User creates payment intent with items (some redeemable)
2. Backend checks if user has previous successful transactions
3. If no previous transactions AND order has redeemable products:
   - Calculate discount on redeemable products only
   - Apply discount to total amount
   - Store discount info in metadata
4. Create Stripe payment intent with discounted amount
5. User completes payment
```

### Loyalty Increment Flow
```
1. Payment succeeds → Stripe webhook fires
2. Webhook handler checks if order contains redeemable products
3. If redeemable products present AND userId exists:
   - Increment loyalty purchase count
   - Update last purchase date
   - Check if user is eligible for free product (every 7 purchases)
```

## Testing Considerations

### Test Scenarios
1. **First-time customer with redeemable products:**
   - Verify discount is applied only to redeemable products
   - Verify regular products are not discounted
   - Verify metadata is correctly stored

2. **First-time customer with only regular products:**
   - Verify no discount is applied
   - Verify order processes normally

3. **Returning customer with redeemable products:**
   - Verify no discount is applied
   - Verify loyalty still increments

4. **Order with mixed products (redeemable + regular):**
   - Verify only redeemable products get discount (first-time only)
   - Verify loyalty increments correctly

5. **Order without userId (guest checkout):**
   - Verify no discount is applied (can't verify first-time status)
   - Verify no loyalty increment (no userId)

## API Changes

### Payment Intent Creation (`POST /payments/intent`)
- **Request:** No changes required
- **Response:** No changes required
- **Internal:** Discount calculation happens automatically based on user history

### Webhook (`POST /webhooks/stripe`)
- **Behavior Change:** Now checks for redeemable products instead of `loyaltyEnrolled` flag
- **Impact:** Loyalty increments automatically for all orders with redeemable products

## Migration Notes

### Existing Products
- All existing products will have `isRedeemable: false` by default
- Products need to be updated via admin interface to mark as redeemable

### Existing Transactions
- Existing transactions will not have the new metadata fields
- First-time customer check only considers transactions with `status: 'succeeded'`
- Historical transactions without `userId` in metadata won't affect first-time customer status

## Future Enhancements

1. **Per-tenant discount configuration:** Allow each tenant to configure their own first-time customer discount percentage
2. **Discount expiration:** Add time-based expiration for first-time customer discounts
3. **Loyalty points system:** Expand beyond purchase count to a points-based system
4. **Discount tiers:** Different discount percentages based on order value or product categories






