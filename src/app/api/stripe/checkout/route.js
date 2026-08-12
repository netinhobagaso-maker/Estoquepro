import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { userId, email } = await request.json();
    const priceId = process.env.STRIPE_PRICE_ID;

    // Trava para evitar o erro do print que você mandou
    if (!priceId) {
      return NextResponse.json({ error: 'Falta a variável STRIPE_PRICE_ID lá na Vercel!' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'boleto'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: { name: 'Acesso Mês 1 (Promocional)' },
            unit_amount: 2000,
          },
          quantity: 1,
        },
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 90,
      },
      metadata: { userId: userId },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?pagamento=sucesso`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?pagamento=cancelado`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
