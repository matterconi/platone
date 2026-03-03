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
    <div className="card-border w-full max-w-md">
      <div className="card flex flex-col items-center gap-8 py-12 px-10">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="PrepWise" width={32} height={32} />
            <h1 className="text-primary-100 text-2xl font-bold">PrepWise</h1>
          </div>
          <p className="text-light-400 text-center text-sm">
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
