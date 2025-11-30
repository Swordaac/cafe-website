# Troubleshooting Loyalty Not Updating

## Quick Checklist

### 1. **Frontend Changes Not Applied?**
   - **Hard refresh your browser**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
   - **Clear browser cache** or use incognito mode
   - **Restart frontend dev server**:
     ```bash
     # Stop the frontend server (Ctrl+C)
     # Then restart
     npm run dev
     # or
     pnpm dev
     ```

### 2. **Backend Not Using Latest Code?**
   - **Check if backend is using TypeScript watch mode**:
     ```bash
     cd backend
     pnpm run dev  # This should use tsx watch
     ```
   - **Or rebuild if using compiled code**:
     ```bash
     cd backend
     pnpm run build
     pnpm start
     ```

### 3. **Make a NEW Payment**
   - **Important**: You must create a NEW payment intent after the code changes
   - Old payment intents created before the fix won't have the metadata
   - Steps:
     1. Go to checkout page
     2. Make sure you're logged in
     3. **Toggle loyalty program ON** (if not already on)
     4. The payment intent should be recreated automatically
     5. Complete the payment with test card: `4242 4242 4242 4242`

### 4. **Check Browser Console**
   Open browser DevTools (F12) and look for:
   ```
   [Cart] Creating payment intent with metadata: { userId: '...', loyaltyEnrolled: true, ... }
   [Checkout] Payment intent created: { userId: '...', loyaltySelected: true, ... }
   ```

### 5. **Check Backend Logs**
   When creating payment intent, you should see:
   ```
   [Payment] Creating payment intent with metadata: {
     tenantId: 'Bouchees',
     metadata: { userId: '...', loyaltyEnrolled: 'true', ... },
     hasUserId: true,
     hasLoyaltyEnrolled: true
   }
   ```

   When payment succeeds, you should see:
   ```
   [Webhook] Payment Intent Succeeded: {
     userId: 'c6ce9efd-68f0-4c4f-b791-f39ee199c970',
     loyaltyEnrolled: 'true',
     isLoyaltyPurchase: true
   }
   [Webhook] Attempting to increment loyalty purchase for: { userId, tenantId }
   [Loyalty] Successfully updated: { purchaseCount: 1, ... }
   ```

### 6. **Verify Webhook is Running**
   Make sure `stripe listen` is still running:
   ```bash
   stripe listen --forward-to localhost:4000/v1/webhooks/stripe
   ```

### 7. **Test the Complete Flow**

1. **Clear old payment intents** (optional):
   - Go to Stripe Dashboard > Payments
   - Cancel any incomplete payment intents

2. **Start fresh**:
   - Log out and log back in
   - Add items to cart
   - Go to checkout
   - **Toggle loyalty ON** (if not already)
   - Wait for payment intent to be created
   - Check browser console for `[Cart]` and `[Checkout]` logs
   - Complete payment with test card

3. **Check results**:
   ```bash
   cd backend
   pnpm run debug:loyalty c6ce9efd-68f0-4c4f-b791-f39ee199c970 Bouchees
   ```

## Common Issues

### Issue: Payment intent created without metadata
**Solution**: Make sure:
- User is logged in when creating payment intent
- Loyalty toggle is ON
- Frontend code is up to date (hard refresh browser)

### Issue: Webhook not receiving events
**Solution**: 
- Check `stripe listen` is running
- Verify webhook secret in `.env` matches `stripe listen` output
- Restart backend after updating webhook secret

### Issue: Metadata missing in webhook
**Solution**:
- The metadata is set when payment intent is CREATED, not when payment completes
- You must create a NEW payment intent after the code changes
- Old payment intents won't have the new metadata

## Debug Commands

```bash
# Check loyalty status
cd backend
pnpm run debug:loyalty [userId] [tenantId]

# Check recent transactions
# Look in MongoDB for Transaction collection

# Check webhook events
# Look in MongoDB for StripeEvent collection
```

