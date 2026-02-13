"use client";

import React, { useState, useEffect, useRef } from "react";
import { BookingForm } from "@/components/booking-form";
import {
  Download,
  X,
  Phone,
  Shield,
  Plane,
  Heart,
  MapPin,
  Briefcase,
  ChevronDown,
  Star,
  Clock,
  CheckCircle2,
  MessageCircle,
} from "lucide-react";

export default function BookPage() {
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const bookingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existing = document.querySelector('link[rel="manifest"]');
    if (existing) existing.remove();
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = "/book/manifest.json";
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const ua = navigator.userAgent;
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(ios);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (!isStandalone) setShowInstallBanner(true);
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const scrollToBooking = () => {
    bookingRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="theme-client min-h-screen bg-background">
      {/* ===== HERO SECTION ===== */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/images/hero-mercedes.jpg"
            alt="Black Mercedes-Benz luxury sedan on an Irish forest road"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background" />
        </div>

        {/* Logo + Nav */}
        <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-4 md:px-10 md:py-6">
          <div className="flex items-center gap-3">
            <img
              src="/rcd-icon-192.jpg"
              alt="Redmond Chauffeur Drive"
              className="h-10 w-10 rounded-lg md:h-12 md:w-12"
            />
            <div>
              <p className="font-serif text-base font-bold tracking-wide text-foreground md:text-lg">
                Redmond
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                Chauffeur Drive
              </p>
            </div>
          </div>
          <a
            href="tel:+353852297379"
            className="flex items-center gap-2 rounded-full border border-primary/30 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-primary/10"
          >
            <Phone className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">085 229 7379</span>
            <span className="sm:hidden">Call</span>
          </a>
        </header>

        {/* Hero Content */}
        <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Executive Transport Service
          </p>
          <h1 className="font-serif text-4xl font-bold leading-tight text-foreground md:text-6xl lg:text-7xl">
            <span className="text-balance">Luxury Transport for All Occasions</span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
            Fully licensed and insured chauffeur service. Corporate events, airport transfers,
            weddings, and private tours across Ireland.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={scrollToBooking}
              className="rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-primary/20"
            >
              Request a Quote
            </button>
            <a
              href="https://wa.me/353852297379"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-foreground/20 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Us
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <button
          type="button"
          onClick={scrollToBooking}
          className="absolute bottom-8 z-10 animate-bounce text-muted-foreground/50"
          aria-label="Scroll down"
        >
          <ChevronDown className="h-6 w-6" />
        </button>
      </section>

      {/* ===== TRUST BAR ===== */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-6 px-6 py-5 md:gap-10">
          {[
            { icon: Shield, label: "SPSV Licensed" },
            { icon: CheckCircle2, label: "Fully Insured" },
            { icon: Star, label: "NTA Approved" },
            { icon: Clock, label: "24/7 Service" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ===== WELCOME ===== */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-primary">Welcome</p>
        <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
          <span className="text-balance">Your Premier Choice for Luxury Chauffeur Service</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Redmond Chauffeur Drive provides a fully licensed and insured luxury chauffeur service
          for corporate and non-corporate clients. With a commitment to impeccable service and
          unparalleled comfort, we are your premier choice for executive transport in Cork and across Ireland.
        </p>
        <div className="mx-auto mt-8 h-px w-16 bg-primary/40" />
      </section>

      {/* ===== SERVICES GRID ===== */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Briefcase,
              title: "Private Bookings",
              desc: "Corporate events, races, restaurants, and any occasion requiring executive transport.",
              image: "/images/chauffeur-door.jpg",
            },
            {
              icon: Plane,
              title: "Airport Transfers",
              desc: "Reliable pick-up and drop-off to Cork, Dublin, Shannon, and Kerry airports.",
              image: "/images/airport-transfer.jpg",
            },
            {
              icon: Heart,
              title: "Weddings",
              desc: "Make your special day unforgettable with our elegant Mercedes-Benz bridal transport.",
              image: "/images/wedding-car.jpg",
            },
            {
              icon: MapPin,
              title: "Private Tours",
              desc: "Explore the Wild Atlantic Way, Ring of Kerry, and the stunning West Cork coastline.",
              image: "/images/private-tour.jpg",
            },
          ].map(({ icon: Icon, title, desc, image }) => (
            <div
              key={title}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="relative h-44 overflow-hidden">
                <img
                  src={image}
                  alt={title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/90">
                  <Icon className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-serif text-base font-bold text-foreground">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== BOOKING SECTION ===== */}
      <section ref={bookingRef} className="border-t border-border bg-card/30 py-16" id="booking">
        <div className="mx-auto max-w-lg px-4">
          <div className="mb-8 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Book Your Journey
            </p>
            <h2 className="font-serif text-2xl font-bold text-foreground md:text-3xl">
              Request a Fare Estimate
            </h2>
            <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
              Complete the form below and we will be in touch with your personalised quote shortly.
            </p>
          </div>

          {/* Install Banner */}
          {showInstallBanner && (
            <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Download className="h-5 w-5 text-primary" />
                  <p className="text-xs font-semibold text-foreground">Add RCD to Home Screen</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInstallBanner(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {deferredPrompt ? (
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-[10px] text-muted-foreground">
                    Tap Install to add the RCD icon to your phone
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      const prompt = deferredPrompt as {
                        prompt: () => void;
                        userChoice: Promise<{ outcome: string }>;
                      };
                      prompt.prompt();
                      const result = await prompt.userChoice;
                      if (result.outcome === "accepted") setShowInstallBanner(false);
                      setDeferredPrompt(null);
                    }}
                    className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    Install
                  </button>
                </div>
              ) : isIOS ? (
                <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                  <p className="font-medium text-foreground">iPhone / iPad:</p>
                  <p>1. Tap the <strong>Share</strong> button (square with arrow) at the bottom of Safari</p>
                  <p>2. Scroll down and tap <strong>{'"Add to Home Screen"'}</strong></p>
                  <p>3. Tap <strong>{'"Add"'}</strong> in the top right</p>
                </div>
              ) : (
                <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                  <p className="font-medium text-foreground">Android:</p>
                  <p>1. Tap the <strong>three dots menu</strong> in the top right of Chrome</p>
                  <p>2. Tap <strong>{'"Add to Home screen"'} or {'"Install app"'}</strong></p>
                </div>
              )}
            </div>
          )}

          {/* Booking Form */}
          <BookingForm />
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border bg-background">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="flex flex-col items-center gap-8 md:flex-row md:justify-between">
            {/* Brand */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center gap-3 md:justify-start">
                <img
                  src="/rcd-icon-192.jpg"
                  alt="RCD"
                  className="h-10 w-10 rounded-lg"
                />
                <div>
                  <p className="font-serif text-base font-bold text-foreground">Redmond Chauffeur Drive</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-primary">Clonakilty, Co. Cork</p>
                </div>
              </div>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">
                Your premier choice for luxury executive transport across Ireland.
                Fully licensed, fully insured, NTA approved.
              </p>
            </div>

            {/* Contact */}
            <div className="flex flex-col items-center gap-3 md:items-end">
              <a
                href="tel:+353852297379"
                className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
              >
                <Phone className="h-4 w-4 text-primary" />
                085 229 7379
              </a>
              <a
                href="https://wa.me/353852297379"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary"
              >
                <MessageCircle className="h-4 w-4 text-primary" />
                WhatsApp
              </a>
              <p className="text-[10px] text-muted-foreground">
                Phone Line Open: 09:00 to 18:00 - Monday to Sunday
              </p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 border-t border-border pt-6">
            {[
              { icon: Shield, label: "SPSV Licensed" },
              { icon: CheckCircle2, label: "Fully Insured" },
              { icon: Star, label: "NTA Approved Operator" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-primary/60" />
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-[10px] text-muted-foreground/40">
            Redmond Chauffeur Drive - Clonakilty, Co. Cork, Ireland
          </p>

          {/* Link back to main website */}
          <p className="mt-2 text-center">
            <a
              href="https://www.redmondcd.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary/50 hover:text-primary"
            >
              www.redmondcd.com
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
