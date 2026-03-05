import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between px-8 py-4 border-b border-white/10">
      <Link href="/" className="flex items-center gap-2">
        <Image src="/logo.svg" alt="PrepWise" width={28} height={28} style={{ width: 28, height: 28 }} />
        <span className="text-white font-semibold text-lg">PrepWise</span>
      </Link>

      <div className="flex items-center gap-5">
        <SignedOut>
          <SignInButton>
            <button className="text-sm text-white/70 hover:text-white transition-colors cursor-pointer">
              Accedi
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard" className="text-sm text-white/60 hover:text-white transition-colors">
            Piano
          </Link>
          <UserButton />
        </SignedIn>
      </div>
    </nav>
  );
};

export default Navbar;
