import 'dotenv/config';
import { stripe } from '../src/services/stripe.js';

async function main() {
  const bal = await stripe.balance.retrieve();
  // eslint-disable-next-line no-console
  console.log('Stripe reachable. Balance object fetched (platform):', bal.object);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});


