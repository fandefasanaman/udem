import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { order_id, amount, payment_method, phone } = await req.json();

    if (!order_id || !amount || !payment_method) {
      return new Response(
        JSON.stringify({ error: 'Paramètres manquants' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Commande introuvable' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let paymentResult;
    if (payment_method === 'mvola') {
      paymentResult = await processMvolaPayment(amount, phone);
    } else if (payment_method === 'orange_money') {
      paymentResult = await processOrangeMoneyPayment(amount, phone);
    } else {
      return new Response(
        JSON.stringify({ error: 'Méthode de paiement non supportée' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        statut: 'confirmed',
        reference_paiement: paymentResult.reference,
      })
      .eq('id', order_id);

    if (updateError) {
      console.error('Error updating order:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        reference: paymentResult.reference,
        message: 'Paiement initié avec succès',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Payment error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur de paiement' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function processMvolaPayment(amount: number, phone: string) {
  console.log('Processing MVola payment:', { amount, phone });
  return {
    reference: `MVOLA-${Date.now()}`,
    status: 'pending',
  };
}

async function processOrangeMoneyPayment(amount: number, phone: string) {
  console.log('Processing Orange Money payment:', { amount, phone });
  return {
    reference: `OM-${Date.now()}`,
    status: 'pending',
  };
}
