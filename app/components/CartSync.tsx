"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "../lib/store/cartStore";

export default function CartSync() {
  const { status } = useSession();
  const setAuthenticated = useCartStore((s) => s.setAuthenticated);

  useEffect(() => {
    if (status === "loading") return;
    setAuthenticated(status === "authenticated");
  }, [status, setAuthenticated]);

  return null;
}
