import { auth } from "$lib/firebase";
import { supabase } from "$lib/supabase";

export async function createUserIfNotExists(name?: string) {
  const user = auth.currentUser;
  if (!user) return;

  try {
    // 🔍 check if user exists
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("uid", user.uid)
      .maybeSingle();

    if (data) return;

    // 🆕 insert user
    await supabase.from("users").insert({
      uid: user.uid,
      name: name ?? user.displayName ?? "User",
      email: user.email ?? "",
      phone: user.phoneNumber ?? "",
      role: "user",
      is_active: true,
      enrollment_ids: [],
      created_at: new Date().toISOString()
    });

    console.log("Supabase user created");

  } catch (e) {
    console.error("createUserIfNotExists error:", e);
  }
}