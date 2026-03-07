// import { browser } from "$app/environment";
// import { goto } from "$app/navigation";
// import { auth } from "$lib/firebase";
// import { supabase } from "$lib/supabase";

// const superAdminUid = "Zzjym4rd6jbxlDsUxCMxZbx2juu2";

// export const load = async ({ url }) => {
//   if (!browser) return {};

//   // 🚫 Prevent running inside /auth pages
//   if (url.pathname.startsWith("/auth")) {
//     return {};
//   }

//   return new Promise((resolve) => {

//     const unsubscribe = auth.onAuthStateChanged(async (user) => {

//       if (!user) {
//         goto("/auth/login");
//         resolve({});
//         unsubscribe();
//         return;
//       }

//       try {
//         const { data } = await supabase
//           .from("users")
//           .select("role")
//           .eq("uid", user.uid)
//           .single();

//         const role = data?.role ?? "user";
//         const path = url.pathname;

//         if (role === "admin" && user.uid === superAdminUid) {
//           if (!path.startsWith("/admin")) {
//             goto("/admin/dashboard");
//           }
//         } else if (role === "mentor") {
//           if (!path.startsWith("/mentor")) {
//             goto("/mentor/dashboard");
//           }
//         } else {
//           if (!path.startsWith("/page")) {
//             goto("/page/home");
//           }
//         }

//         resolve({});
//         unsubscribe();

//       } catch (e) {
//         console.error("Session error", e);
//         resolve({});
//         unsubscribe();
//       }
//     });

//   });
// };





// // import { browser } from "$app/environment";
// // import { goto } from "$app/navigation";
// // import { auth } from "$lib/firebase";
// // import { supabase } from "$lib/supabase";

// // const superAdminUid = "Zzjym4rd6jbxlDsUxCMxZbx2juu2";

// // export const load = async () => {
// //   if (!browser) return;

// //   return new Promise((resolve) => {
// //     auth.onAuthStateChanged(async (user) => {

// //       // ❌ not logged
// //       if (!user) {
// //         goto("/auth/login");
// //         return resolve({});
// //       }

// //       const uid = user.uid;

// //       try {
// //         // 🔥 fetch role from Supabase
// //         const { data } = await supabase
// //           .from("users")
// //           .select("role")
// //           .eq("uid", uid)
// //           .single();

// //         const role = data?.role ?? "user";

// //         // 👑 admin
// //         if (role === "admin" && uid === superAdminUid) {
// //           goto("/admin/dashboard");
// //           return resolve({});
// //         }

// //         // 🎓 mentor
// //         if (role === "mentor") {
// //           goto("/mentor/dashboard");
// //           return resolve({});
// //         }

// //         // 👤 normal user
// //         goto("/page/home");
// //         resolve({});

// //       } catch (e) {
// //         console.error("Session error", e);
      
// //         resolve({});
// //       }
// //     });
// //   });
// // };