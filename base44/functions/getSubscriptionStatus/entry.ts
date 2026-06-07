import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

    // Find active subscriptions for this user's email
    const customers = await stripe.customers.list({ email: user.email, limit: 5 });

    if (customers.data.length === 0) {
      return Response.json({ isActive: false });
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    const isActive = subscriptions.data.length > 0;
    const subscription = isActive ? subscriptions.data[0] : null;

    return Response.json({
      isActive,
      subscriptionId: subscription?.id || null,
      currentPeriodEnd: subscription?.current_period_end || null,
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});