"use client";

import { useSignIn } from "@clerk/nextjs";
import Image from "next/image";

import { Button } from "@/components/ui/button";

const AuthForm = () => {
  const { signIn } = useSignIn();

  const handleGoogleSignIn = async () => {
    await signIn?.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/",
    });
  };

  return (
    <div className="p-0.5 rounded-2xl bg-linear-to-b from-[#4B4D4F] to-[#4B4D4F33] w-full max-w-md">
      <div className="bg-linear-to-b from-[#1A1C20] to-[#08090D] rounded-2xl min-h-full flex flex-col items-center gap-8 py-12 px-10">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="PrepWise" width={32} height={32} />
            <h1 className="text-violet-100 text-2xl font-bold">PrepWise</h1>
          </div>
          <p className="text-indigo-400 text-center text-sm">
            Accedi per iniziare a prepararti con il tuo AI voice assistant.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
        >
          <Image src="/react.svg" alt="Google" width={18} height={18} />
          Continua con Google
        </Button>
      </div>
    </div>
  );
};

export default AuthForm;
