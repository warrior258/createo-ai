"use client"
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  
  const googleSignIn = async () => {
      setLoading(true);
      try {
          const res = await fetch("/api/google-auth");
          const data = await res.json();

          if (data.success) {
              window.location.href = data.url; // Redirect user to Google OAuth
          } else {
              console.error("OAuth error:", data.error);
          }
      } catch (error) {
          console.error("Request failed:", error);
      } finally {
          setLoading(false);
      }
  };
  
  return (
    <div className="grid place-content-center w-full">
      <h1 className="text-center text-3xl font-bold mb-10">Createo-ai</h1>
      <Button variant={"outline"} onClick={googleSignIn}>
        {loading && <Loader2 className="animate-spin" />}
        Continue with Google
      </Button>
    </div>
  );
}
