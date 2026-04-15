import { createClient } from "@supabase/supabase-js";
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public";

export const supabase = createClient(
  PUBLIC_SUPABASE_URL ?? "",
  PUBLIC_SUPABASE_ANON_KEY ?? ""
);


console.log("URL:", PUBLIC_SUPABASE_URL);
console.log("KEY:", PUBLIC_SUPABASE_ANON_KEY);

// import { createClient } from "@supabase/supabase-js";
// import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public";

// export const supabase = createClient(
//   PUBLIC_SUPABASE_URL,
//   PUBLIC_SUPABASE_ANON_KEY
// );


// import { createClient } from "@supabase/supabase-js";
// import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from "$env/static/public";

// export const supabase = createClient(
//   PUBLIC_SUPABASE_URL,
//   PUBLIC_SUPABASE_ANON_KEY
// );