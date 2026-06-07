import Stripe from 'npm:stripe@14.21.0';
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  console.log('Stripe webhook event:', event.type);

  // We just log the events for now — status is checked live via getSubscriptionStatus
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('Checkout completed for portfolio:', session.metadata?.portfolio_id);
  } else if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    console.log('Subscription cancelled:', sub.id);
  } else if (event.type === 'invoice.paid') {
    console.log('Invoice paid:', event.data.object.id);
  }

  return Response.json({ received: true });
});