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

    const { user_id, formation_id } = await req.json();

    if (!user_id || !formation_id) {
      return new Response(
        JSON.stringify({ error: 'Paramètres manquants' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: purchase, error: purchaseError } = await supabase
      .from('order_items')
      .select('*, order:orders!inner(*)')
      .eq('formation_id', formation_id)
      .eq('order.user_id', user_id)
      .eq('order.statut', 'completed')
      .maybeSingle();

    if (purchaseError || !purchase) {
      return new Response(
        JSON.stringify({ error: 'Formation non achetée ou paiement non complété' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: download, error: downloadError } = await supabase
      .from('downloads')
      .select('*')
      .eq('user_id', user_id)
      .eq('formation_id', formation_id)
      .maybeSingle();

    if (downloadError && downloadError.code !== 'PGRST116') {
      throw downloadError;
    }

    if (download && download.download_count >= download.max_downloads) {
      return new Response(
        JSON.stringify({ error: 'Limite de téléchargements atteinte' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: formation, error: formationError } = await supabase
      .from('formations')
      .select('fichier_path')
      .eq('id', formation_id)
      .single();

    if (formationError || !formation) {
      return new Response(
        JSON.stringify({ error: 'Formation introuvable' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: signedUrl, error: urlError } = await supabase
      .storage
      .from('formations')
      .createSignedUrl(formation.fichier_path, 3600);

    if (urlError || !signedUrl) {
      throw new Error('Erreur génération lien de téléchargement');
    }

    if (download) {
      await supabase
        .from('downloads')
        .update({
          download_count: download.download_count + 1,
          last_download: new Date().toISOString(),
        })
        .eq('id', download.id);
    } else {
      await supabase
        .from('downloads')
        .insert({
          user_id,
          formation_id,
          download_count: 1,
          last_download: new Date().toISOString(),
        });
    }

    return new Response(
      JSON.stringify({
        url: signedUrl.signedUrl,
        expires_in: 3600,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Download error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Erreur de téléchargement' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
