import { ReactNode } from "react";

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <main className="bg-[#08090D] flex min-h-screen w-full items-center justify-center px-4 py-8">
      {children}
    </main>
  );
};

export default AuthLayout;
