/**
 * Stripe server client.
 * Reads STRIPE_SECRET_KEY from environment.
 * Webhook handler uses STRIPE_WEBHOOK_SECRET for signature verification.
 */

import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeClient) return stripeClient;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  stripeClient = new Stripe(key, {
    typescript: true,
  });

  return stripeClient;
}

/**
 * Map AppForge tier IDs to Stripe price IDs.
 * Set these in your environment after creating products in Stripe Dashboard:
 *   STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO, STRIPE_PRICE_ENTERPRISE
 */
export function getStripePriceId(tier: string): string | null {
  const map: Record<string, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER,
    pro: process.env.STRIPE_PRICE_PRO,
    enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
  };
  return map[tier] || null;
}
