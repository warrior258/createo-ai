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
    <div className="grid grid-cols-2 h-[100vh]">
      <div className="h-full relative">
        <div className="absolute top-[42%] left-[28%] translate-x-[-50%] translate-y-[-50%]">
          <h1 className="text-white text-6xl font-semibold">CreateoAI</h1>
          <p className="text-white italic text-sm mt-2">AI powered video creation</p>
        </div>
        <img src="login.jpg" className="h-full object-cover object-left" alt="login" />
      </div>

      <div className="h-full grid place-content-center">
          <Button variant={"outline"} size={"lg"} onClick={googleSignIn}>
            {loading ? <Loader2 className="animate-spin" /> : <img width={20} src="https://www.gstatic.com/marketing-cms/assets/images/d5/dc/cfe9ce8b4425b410b49b7f2dd3f3/g.webp=s48-fcrop64=1,00000000ffffffff-rw"/>}
            Continue with Google
          </Button>
      </div>
    </div>
  );
}
