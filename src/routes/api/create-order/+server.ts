import Razorpay from "razorpay";
import { json } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET
});

export async function POST({ request }) {
  const { amount } = await request.json();

  const order = await razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    receipt: "receipt_" + Date.now()
  });

  return json(order);
}