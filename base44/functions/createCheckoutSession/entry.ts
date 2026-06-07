import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const { portfolioId, portfolioName } = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: 'price_1Tfhs2It5ybbqONMbq13ZyIe', quantity: 1 }],
      success_url: `${req.headers.get('origin') || 'https://app.base44.com'}/?subscription=success&portfolioId=${portfolioId}`,
      cancel_url: `${req.headers.get('origin') || 'https://app.base44.com'}/?subscription=cancelled`,
      customer_email: user.email,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        portfolio_id: portfolioId,
        portfolio_name: portfolioName || '',
        user_email: user.email,
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});