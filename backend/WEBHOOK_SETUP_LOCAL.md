# Setting Up Stripe Webhooks for Local Development

This guide will help you set up Stripe webhooks locally so that loyalty points are incremented when payments succeed.

## Prerequisites

1. **Install Stripe CLI** (if not already installed):
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe CLI**:
   ```bash
   stripe login
   ```
   This will open your browser to authenticate with your Stripe account.

## Step-by-Step Setup

### Step 1: Start Your Backend Server

Make sure your backend is running on port 4000 (default):

```bash
cd backend
pnpm run dev
```

Your server should be running at `http://localhost:4000`

### Step 2: Forward Webhooks to Your Local Server

In a **new terminal window**, run:

```bash
stripe listen --forward-to localhost:4000/v1/webhooks/stripe
```

You should see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

### Step 3: Copy the Webhook Signing Secret

The CLI will display a webhook signing secret that looks like:
```
whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Copy this secret** - you'll need it in the next step.

### Step 4: Add to Your .env File

Add or update `STRIPE_WEBHOOK_SECRET` in your `backend/.env` file:

```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Important**: This secret changes each time you run `stripe listen`, so you need to update your `.env` file each time you restart the webhook listener.

### Step 5: Restart Your Backend Server

After updating `.env`, restart your backend server to load the new webhook secret:

```bash
# Stop the server (Ctrl+C) and restart
pnpm run dev
```

## Testing the Webhook

### Option 1: Trigger a Test Event

In the terminal where `stripe listen` is running, trigger a test event:

```bash
# In a new terminal
stripe trigger payment_intent.succeeded
```

You should see:
- The event appear in your `stripe listen` terminal
- Logs in your backend server showing the webhook was received
- Check your backend logs for `[Webhook] Payment Intent Succeeded:` messages

### Option 2: Complete a Test Payment

1. Go to your checkout page
2. Use a test card: `4242 4242 4242 4242`
3. Complete the payment
4. Check your backend logs for webhook processing

## Verifying It's Working

After a successful payment, check:

1. **Backend logs** should show:
   ```
   [Webhook] Payment Intent Succeeded: { ... }
   [Webhook] Attempting to increment loyalty purchase for: { userId, tenantId }
   [Loyalty] Successfully updated: { ... }
   ```

2. **Database** - Run the debug script:
   ```bash
   pnpm run debug:loyalty [userId] [tenantId]
   ```
   You should see `purchaseCount` incremented.

## Troubleshooting

### Webhook Not Receiving Events

1. **Check if `stripe listen` is running** - Make sure the terminal with `stripe listen` is still active
2. **Verify the endpoint URL** - Should be `localhost:4000/v1/webhooks/stripe`
3. **Check backend is running** - Make sure your backend server is running on port 4000
4. **Verify webhook secret** - Make sure `STRIPE_WEBHOOK_SECRET` in `.env` matches what `stripe listen` shows

### Webhook Signature Verification Failing

- Make sure `STRIPE_WEBHOOK_SECRET` in `.env` matches the secret from `stripe listen`
- Restart your backend after updating `.env`
- The webhook secret changes each time you restart `stripe listen`

### Events Not Processing

- Check backend logs for errors
- Verify the payment intent has `userId` and `loyaltyEnrolled: 'true'` in metadata
- Make sure the user is enrolled in the loyalty program

## Quick Reference

```bash
# Terminal 1: Start backend
cd backend
pnpm run dev

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:4000/v1/webhooks/stripe

# Terminal 3: Trigger test event (optional)
stripe trigger payment_intent.succeeded
```

## Production Setup

For production, you'll need to:
1. Go to Stripe Dashboard > Webhooks
2. Add endpoint: `https://your-production-url.com/v1/webhooks/stripe`
3. Select events: `payment_intent.succeeded`, `payment_intent.payment_failed`, etc.
4. Copy the webhook signing secret to your production environment variables

