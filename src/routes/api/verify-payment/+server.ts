import crypto from "crypto";
import { json } from "@sveltejs/kit";
import { createClient } from "@supabase/supabase-js";

export async function POST({ request }) {

  const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    courseId,
    userId
  } = await request.json();

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex");

  if (expectedSignature !== razorpay_signature) {
    return json({ success: false }, { status: 400 });
  }

  await supabase.from("enrollments").insert({
    user_id: userId,
    course_id: courseId
  });

  return json({ success: true });
}




















// import crypto from "crypto";
// import { json } from "@sveltejs/kit";
// import { createClient } from "@supabase/supabase-js";

// const supabase = createClient(
//   process.env.PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );

// export async function POST({ request }) {
//   const {
//     razorpay_order_id,
//     razorpay_payment_id,
//     razorpay_signature,
//     courseId,
//     userId
//   } = await request.json();

//   const body = razorpay_order_id + "|" + razorpay_payment_id;

//   const expectedSignature = crypto
//     .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
//     .update(body)
//     .digest("hex");

//   if (expectedSignature !== razorpay_signature) {
//     return json({ success: false }, { status: 400 });
//   }

//   await supabase.from("enrollments").insert({
//     user_id: userId,
//     course_id: courseId
//   });

//   return json({ success: true });
// }