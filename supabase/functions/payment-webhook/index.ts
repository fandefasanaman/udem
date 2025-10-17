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

    const payload = await req.json();
    const { reference, status, order_id } = payload;

    if (!reference || !status || !order_id) {
      return new Response(
        JSON.stringify({ error: 'Données de webhook invalides' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let newStatus = 'pending';
    if (status === 'success' || status === 'completed') {
      newStatus = 'completed';
    } else if (status === 'failed' || status === 'error') {
      newStatus = 'failed';
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        statut: newStatus,
        date_paiement: newStatus === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', order_id)
      .eq('reference_paiement', reference);

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook traité' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur webhook' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
