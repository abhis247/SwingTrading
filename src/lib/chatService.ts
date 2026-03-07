import { supabase } from "$lib/supabase";

export async function getOrCreateChatRoom(studentId: string, mentorId: string) {
  try {
    // 1️⃣ check existing room
    const { data: existing, error } = await supabase
      .from("chat_rooms")
      .select("id")
      .eq("student_id", studentId)
      .eq("mentor_id", mentorId)
      .maybeSingle();

    if (error) throw error;

    if (existing?.id) {
      return existing.id;
    }

    // 2️⃣ create new room
    const { data: newRoom, error: insertError } = await supabase
      .from("chat_rooms")
      .insert({
        student_id: studentId,
        mentor_id: mentorId,
      })
      .select("id")
      .single();

    if (insertError) throw insertError;

    return newRoom.id;
  } catch (e) {
    console.error("Chat room error:", e);
    throw e;
  }
}