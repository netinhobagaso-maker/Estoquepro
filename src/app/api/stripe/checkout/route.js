import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request) {
  try {
    const { userId, email } = await request.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'pix', 'boleto'],
      mode: 'subscription',
      customer_email: email,
      line_items: [
        {
          // Esta é a cobrança avulsa do PRIMEIRO MÊS (R$ 20,00)
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Acesso Mês 1 (Promocional)',
            },
            unit_amount: 2000, // R$ 20,00 em centavos
          },
          quantity: 1,
        },
        {
          // Este é o plano recorrente configurado no seu .env
          price: process.env.STRIPE_PRICE_ID, // O preço de R$ 49,99 que você criou no painel do Stripe
          quantity: 1,
        },
      ],
      subscription_data: {
        // Dá 90 dias de carência no plano recorrente (Cobre o mês 1 pago avulso + os meses 2 e 3 grátis)
        // O valor de R$ 49,99 só será cobrado no 4º mês.
        trial_period_days: 90, 
      },
      metadata: {
        userId: userId,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?pagamento=sucesso`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?pagamento=cancelado`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
