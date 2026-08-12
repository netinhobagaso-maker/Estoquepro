import Stripe from 'stripe';
import { NextResponse } from 'next/server';

// Puxa a chave secreta que você configurou na Vercel
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'boleto'], // O Stripe aceita cartão nativamente para isso
      line_items: [
        // 1. A TAXA INICIAL DE R$ 20,00 (Paga na hora)
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Acesso Inicial (1º Mês + 2 Meses Grátis)',
              description: 'Pagamento inicial de R$ 20. Os próximos 2 meses são grátis!',
            },
            unit_amount: 2000, // R$ 20,00 em centavos
          },
          quantity: 1,
        },
        // 2. A ASSINATURA DE R$ 49,99 (Que vai ficar "pausada" por 90 dias)
        {
          price_data: {
            currency: 'brl',
            recurring: {
              interval: 'month',
            },
            product_data: {
              name: 'Mensalidade Zipp App',
            },
            unit_amount: 4999, // R$ 49,99 em centavos
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: 90, // Diz ao Stripe: "Só comece a cobrar os 49,99 daqui a 3 meses!"
      },
      // Para onde o usuário vai depois de pagar:
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/sucesso`, 
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
