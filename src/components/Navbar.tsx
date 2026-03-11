"use client";

import Image from "next/image";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

function NavLogo() {
  const bars = [{ h: 8 }, { h: 14 }, { h: 11 }, { h: 16 }, { h: 10 }];
  return (
    <svg width="18" height="16" viewBox="0 0 18 16" aria-hidden="true" style={{ display: "block", flexShrink: 0 }}>
      {bars.map(({ h }, i) => (
        <rect
          key={i}
          x={i * 4}
          y={(16 - h) / 2}
          width="2.5"
          height={h}
          rx="1"
          fill="var(--accent)"
        />
      ))}
    </svg>
  );
}

const NAV_LINKS = [
  { label: "Come funziona", href: "#come-funziona" },
  { label: "Agenti", href: "#agenti" },
  { label: "Prezzi", href: "#prezzi" },
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-navbar]")) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <header data-navbar>
      <div className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <NavLogo />
          <span className="font-bold tracking-tight text-base" style={{ fontFamily: "var(--font-syne, inherit)", color: "var(--fg)" }}>
            Inter<span style={{ color: "var(--accent)" }}>voice</span>
          </span>
        </Link>

        {/* Center nav — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative px-4 py-1.5 text-sm rounded-full transition-colors duration-200 group"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "var(--fg)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color = "var(--muted)")
              }
            >
              {link.label}
              <span
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: "rgba(240,237,230,0.04)" }}
              />
            </a>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <SignedOut>
            <SignInButton>
              <button
                className="hidden sm:block text-sm transition-colors duration-200 cursor-pointer"
                style={{ color: "var(--muted)" }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "var(--fg)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.color = "var(--muted)")
                }
              >
                Accedi
              </button>
            </SignInButton>
            <SignInButton>
              <button
                className="cta-primary hidden sm:inline-flex"
                style={{ height: 36, padding: "0 18px", fontSize: "0.8125rem" }}
              >
                Inizia gratis
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </SignInButton>
            {/* Mobile: solo "Accedi" */}
            <SignInButton>
              <button
                className="sm:hidden text-sm transition-colors duration-200 cursor-pointer"
                style={{ color: "var(--muted)" }}
              >
                Accedi
              </button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Link href="/dashboard" className="hidden sm:block" aria-label="Profile">
              {user?.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt="Avatar"
                  width={30}
                  height={30}
                  style={{ borderRadius: "50%", display: "block" }}
                />
              ) : (
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "var(--border)",
                    display: "block",
                  }}
                />
              )}
            </Link>
          </SignedIn>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 gap-1.5 -mr-1"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span
              className="block h-px w-5 transition-all duration-300 origin-center"
              style={{
                background: "var(--fg)",
                transform: menuOpen ? "rotate(45deg) translateY(6px)" : "none",
              }}
            />
            <span
              className="block h-px w-5 transition-all duration-300"
              style={{
                background: "var(--fg)",
                opacity: menuOpen ? 0 : 1,
              }}
            />
            <span
              className="block h-px w-5 transition-all duration-300 origin-center"
              style={{
                background: "var(--fg)",
                transform: menuOpen ? "rotate(-45deg) translateY(-6px)" : "none",
              }}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu drawer */}
      <div
        className="md:hidden overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: menuOpen ? "280px" : "0px",
          opacity: menuOpen ? 1 : 0,
        }}
      >
        <div
          className="px-6 pb-5 pt-1 flex flex-col gap-1"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="py-3 text-sm transition-colors duration-200"
              style={{
                color: "var(--muted)",
                borderBottom: "1px solid var(--border)",
              }}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <SignedOut>
            <SignInButton>
              <button
                className="cta-primary mt-3 w-full justify-center"
                style={{ height: 44 }}
                onClick={() => setMenuOpen(false)}
              >
                Inizia gratis
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="cta-primary mt-3 w-full justify-center"
              style={{ height: 44 }}
              onClick={() => setMenuOpen(false)}
            >
              Profile
            </Link>
          </SignedIn>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
