import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, mobile, password, panchayath_id, ward_numbers } = await req.json();

    if (!name || !mobile || !password || !panchayath_id || !ward_numbers?.length) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate mobile number format
    const cleanMobile = mobile.replace(/\D/g, "");
    if (cleanMobile.length < 10) {
      return new Response(
        JSON.stringify({ error: "Invalid mobile number" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Use mobile as fake email for auth
    const fakeEmail = `${cleanMobile}@staff.handrest.local`;

    // Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("phone", cleanMobile)
      .single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: "An account with this mobile number already exists" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: fakeEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, phone: cleanMobile },
    });

    if (authError) {
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user.id;

    // Create profile
    await supabaseAdmin.from("profiles").insert({
      user_id: userId,
      full_name: name,
      email: fakeEmail,
      phone: cleanMobile,
    });

    // Assign staff role
    await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: "staff",
    });

    // Create staff details
    await supabaseAdmin.from("staff_details").insert({
      user_id: userId,
      is_available: true,
    });

    // Assign panchayath and wards
    await supabaseAdmin.from("staff_panchayath_assignments").insert({
      staff_user_id: userId,
      panchayath_id,
      ward_numbers,
    });

    return new Response(
      JSON.stringify({ success: true, user_id: userId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
