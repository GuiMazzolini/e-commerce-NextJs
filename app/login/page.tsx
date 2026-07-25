import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in or create a StyleShop account to save your cart and checkout.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-linear-to-b from-blue-50 to-white flex items-center justify-center">
          <div className="h-10 w-48 rounded-lg bg-gray-200 animate-pulse" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
