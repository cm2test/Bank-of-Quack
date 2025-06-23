// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET_NAMES = [
  "avatars",
  "category-images",
  "empty-state-images",
  "income-images",
  "reimbursement-images",
  "settlement-images",
];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401,
        });
    }

    const { data: buckets, error: listError } = await supabaseClient.storage.listBuckets();

    if (listError) {
      throw listError;
    }

    const existingBucketNames = buckets.map((bucket) => bucket.name);
    const createdBuckets = [];
    const existingBuckets = [];

    for (const bucketName of BUCKET_NAMES) {
      if (!existingBucketNames.includes(bucketName)) {
        const { error: createError } = await supabaseClient.storage.createBucket(
          bucketName,
          {
            public: true,
            allowedMimeTypes: ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/svg+xml"],
            fileSizeLimit: 1024 * 1024 * 5, // 5MB
          }
        );
        if (createError) {
          console.error(`Error creating bucket "${bucketName}":`, createError.message);
        } else {
          createdBuckets.push(bucketName);
        }
      } else {
        existingBuckets.push(bucketName);
      }
    }

    return new Response(JSON.stringify({ createdBuckets, existingBuckets }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-buckets' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
