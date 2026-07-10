"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/toast";

export function ScanAlert() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (shown) return;
    
    const scanned = searchParams.get("scanned");
    const points = searchParams.get("points");
    const product = searchParams.get("product");
    const reason = searchParams.get("reason");

    if (scanned === "success") {
      toast({
        tone: "success",
        title: "Scan Successful! 🎉",
        description: `You earned ${points} points from scanning ${product}.`
      });
      setShown(true);
      // Clean up URL without reloading
      window.history.replaceState({}, '', '/app/wallet');
    } else if (scanned === "error") {
      const msg = reason === "already_redeemed" ? "This QR code has already been redeemed." 
                : reason === "not_found" ? "Invalid or unrecognized QR code."
                : "Failed to redeem code. Please try again.";
      toast({
        tone: "error",
        title: "Scan Failed",
        description: msg
      });
      setShown(true);
      window.history.replaceState({}, '', '/app/wallet');
    }
  }, [searchParams, toast, shown]);

  return null;
}
