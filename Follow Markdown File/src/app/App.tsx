import {
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Globe,
  LayoutDashboard,
  LineChart,
  Mail,
  MapPin,
  Phone,
  Users,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Bell,
  BarChart3,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/ui/accordion";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

import shot1 from "../imports/1CRM.png";
import shot2 from "../imports/2CRM.png";
import shot3 from "../imports/3CRM.png";
import shot4 from "../imports/4CRM.png";
import shot5 from "../imports/5CRM.png";
import shot6 from "../imports/6CRM.png";
import shot7 from "../imports/7CRM.png";
import shot8 from "../imports/8CRM.png";
import shot9 from "../imports/9CRM.png";
import logoImg from "../imports/Group_5374.png";
import imgViewServices from "../imports/image_49_.png";
import imgCustomerBooks from "../imports/image_34_.png";
import imgBookingConfirmed from "../imports/image_36_.png";
import imgCreateServices from "../imports/image_40_.png";
import imgConfigureAvailability from "../imports/image_41_.png";
import imgManageBookings from "../imports/image_42_.png";
import imgTrackAnalytics from "../imports/image_43_.png";
import websiteBuilderImg from "../imports/image-4.png";
import crmDashboardImg from "../imports/image-5.png";

// Tokens from abc.md:
//   color: #ffffff (single dominant); depth via borders only; no shadows.
//   typography: Inter; weights 400/500/600; body 14–16px.
//   rule: one primary action color per screen.
const border = "border border-[#e6e6e6]";
const subtle = "text-[#666]";
const ink = "text-[#111]";

// Custom hook for scroll animations
function useScrollAnimation() {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -100px 0px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return { ref, isVisible };
}

function Section({
  id,
  className = "",
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={className}>
      <div className="max-w-6xl mx-auto px-6 py-24">{children}</div>
    </section>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`uppercase tracking-[0.18em] ${subtle}`}
      style={{ fontSize: 12, fontWeight: 500 }}
    >
      {children}
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className={`mt-3 ${ink} tracking-tight`}
      style={{ fontSize: 32, lineHeight: 1.15, fontWeight: 600 }}
    >
      {children}
    </h2>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p className={`mt-3 ${subtle}`} style={{ fontSize: 16, lineHeight: 1.6, fontWeight: 400 }}>
      {children}
    </p>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e6e6e6]">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <a href="#home" className="flex items-center gap-2 transition-transform hover:scale-[1.02]">
          <img
            src={logoImg}
            alt="BookBikes by Cubites"
            className="h-8 w-auto"
          />
        </a>
        <nav
          className={`hidden md:flex items-center gap-7 ${subtle}`}
          style={{ fontSize: 14 }}
        >
          {[
            { href: "#home", label: "Home" },
            { href: "#features", label: "Features" },
            { href: "#faq", label: "FAQ" },
            { href: "#contact", label: "Contact" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="relative hover:text-[#2942EE] transition-colors duration-200 after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-gradient-to-r after:from-[#2942EE] after:to-[#A855F7] hover:after:w-full after:transition-all after:duration-300"
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            className="hidden sm:inline-flex h-8 px-3 shadow-none hover:bg-[#f5f5f5] transition-colors"
            style={{ fontSize: 14, fontWeight: 500 }}
          >
            Sign in
          </Button>
        </div>
      </div>
    </header>
  );
}

type EcoCard = {
  src: string;
  label: string;
  purpose: string;
  rotation: number;
  size: "sm" | "md" | "lg";
  // position in % of the ecosystem container
  top: string;
  left: string;
  // anchor point on the card edge (0..1) for the connecting curve
  anchorX: number; // 0 = left edge, 1 = right edge
  anchorY: number; // 0 = top, 1 = bottom
  floatDur: number; // seconds
  floatDelay: number;
  floatY: number; // px amplitude
};

const SIZE_MAP = {
  sm: "w-[180px] md:w-[210px]",
  md: "w-[220px] md:w-[260px]",
  lg: "w-[260px] md:w-[310px]",
};

function HeroCard({
  card,
  index,
  cardRef,
}: {
  card: EcoCard;
  index: number;
  cardRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={cardRef}
      className={`absolute ${SIZE_MAP[card.size]} group`}
      style={{
        top: card.top,
        left: card.left,
        transform: "translate(-50%, -50%)",
        animation: `heroReveal 0.8s ease-out ${index * 100}ms both`,
      }}
    >
      <div
        style={{
          animation: `heroFloat ${card.floatDur}s ease-in-out ${card.floatDelay}s infinite`,
          ["--float-y" as never]: `${card.floatY}px`,
        }}
      >
        <div
          className="relative rounded-xl bg-white/80 backdrop-blur-md border border-[#e6e6e6] overflow-hidden transition-all duration-500 group-hover:-translate-y-2.5 group-hover:scale-[1.03] group-hover:border-[#A855F7]/60"
          style={{
            transform: `rotate(${card.rotation}deg)`,
            boxShadow:
              "0 10px 30px -12px rgba(41,66,238,0.18), 0 4px 12px -4px rgba(168,85,247,0.12)",
          }}
        >
          <ImageWithFallback
            src={card.src}
            alt={card.label}
            className="w-full h-auto block"
          />
        </div>
      </div>
    </div>
  );
}

function Hero() {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const centerRef = React.useRef<HTMLDivElement | null>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [paths, setPaths] = React.useState<string[]>([]);
  const [mids, setMids] = React.useState<{ x: number; y: number }[]>([]);
  const [box, setBox] = React.useState({ w: 1100, h: 760 });

  const cards: EcoCard[] = [
    // Left — customer experience (vertical stack)
    { src: imgViewServices, label: "View Services", purpose: "Browse services", rotation: 0, size: "md", top: "16%", left: "14%", anchorX: 1, anchorY: 0.5, floatDur: 6, floatDelay: 0, floatY: -8 },
    { src: imgCustomerBooks, label: "Customer Books", purpose: "Pick date & time", rotation: 0, size: "md", top: "50%", left: "14%", anchorX: 1, anchorY: 0.5, floatDur: 5, floatDelay: 0.6, floatY: 6 },
    { src: imgBookingConfirmed, label: "Booking Confirmed", purpose: "Receive confirmation", rotation: 0, size: "md", top: "84%", left: "14%", anchorX: 1, anchorY: 0.5, floatDur: 7, floatDelay: 1.2, floatY: -6 },
    // Right — business management (vertical stack)
    { src: imgCreateServices, label: "Create Services", purpose: "Build offerings", rotation: 0, size: "md", top: "12%", left: "86%", anchorX: 0, anchorY: 0.5, floatDur: 6.5, floatDelay: 0.2, floatY: -8 },
    { src: imgConfigureAvailability, label: "Configure Availability", purpose: "Set schedules", rotation: 0, size: "md", top: "38%", left: "80%", anchorX: 0, anchorY: 0.5, floatDur: 5.5, floatDelay: 0.9, floatY: 8 },
    { src: imgManageBookings, label: "Manage Bookings", purpose: "Run the day", rotation: 0, size: "md", top: "62%", left: "86%", anchorX: 0, anchorY: 0.5, floatDur: 6.2, floatDelay: 0.4, floatY: -6 },
    { src: imgTrackAnalytics, label: "Track Analytics", purpose: "Monitor growth", rotation: 0, size: "md", top: "88%", left: "86%", anchorX: 0, anchorY: 0.5, floatDur: 7, floatDelay: 1.5, floatY: 6 },
  ];

  React.useLayoutEffect(() => {
    const compute = () => {
      const container = containerRef.current;
      const center = centerRef.current;
      if (!container || !center) return;
      const cRect = container.getBoundingClientRect();
      setBox({ w: cRect.width, h: cRect.height });
      const centerRect = center.getBoundingClientRect();
      const cx = centerRect.left - cRect.left + centerRect.width / 2;
      const cy = centerRect.top - cRect.top + centerRect.height / 2;

      const newPaths: string[] = [];
      const newMids: { x: number; y: number }[] = [];
      const centerRadius = centerRect.width / 2;
      cardRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const card = cards[i];
        const x = r.left - cRect.left + r.width * card.anchorX;
        const y = r.top - cRect.top + r.height * card.anchorY;
        // stop the curve at the edge of the center node (not its middle)
        const dx = cx - x;
        const dy = cy - y;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const ex = cx - (dx / dist) * centerRadius;
        const ey = cy - (dy / dist) * centerRadius;
        const cpx = (x + ex) / 2;
        const cpy = y;
        newPaths.push(`M ${x} ${y} Q ${cpx} ${cpy} ${ex} ${ey}`);
        // quadratic midpoint at t=0.5
        const mx = 0.25 * x + 0.5 * cpx + 0.25 * ex;
        const my = 0.25 * y + 0.5 * cpy + 0.25 * ey;
        newMids.push({ x: mx, y: my });
      });
      setPaths(newPaths);
      setMids(newMids);
    };
    compute();
    const ro = new ResizeObserver(compute);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, []);

  return (
    <section
      id="home"
      className="relative overflow-hidden"
      style={{
        background:
          "radial-gradient(circle at 15% 40%, rgba(99,102,241,0.06), transparent 50%), radial-gradient(circle at 85% 50%, rgba(139,92,246,0.05), transparent 50%), #ffffff",
      }}
    >
      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(var(--float-y, -10px)); }
        }
        @keyframes heroReveal {
          0% { opacity: 0; transform: translate(-50%, calc(-50% + 60px)) scale(0.95); }
          100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes heroPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(168,85,247,0.35), 0 20px 60px -20px rgba(41,66,238,0.35); }
          50% { transform: scale(1.03); box-shadow: 0 0 0 18px rgba(168,85,247,0), 0 24px 70px -20px rgba(41,66,238,0.45); }
        }
        @keyframes heroDot {
          0% { offset-distance: 0%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { offset-distance: 100%; opacity: 0; }
        }
      `}</style>

      <div className="max-w-6xl mx-auto px-6 pt-20 pb-12 relative">
        <h1
          className="max-w-3xl tracking-tight text-center mx-auto animate-[fadeUp_0.7s_ease-out]"
          style={{ fontSize: 56, lineHeight: 1.05, fontWeight: 600 }}
        >
          Run your entire booking business from{" "}
          <span className="bg-gradient-to-r from-[#2942EE] via-[#7C3AED] to-[#A855F7] bg-clip-text text-transparent">
            one calm, focused
          </span>{" "}
          platform.
        </h1>
        <p
          className={`mt-5 max-w-2xl mx-auto text-center ${subtle} animate-[fadeUp_0.8s_ease-out]`}
          style={{ fontSize: 16, lineHeight: 1.6 }}
        >
          Create services, configure availability, manage bookings, and track growth
          from one unified platform.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3 animate-[fadeUp_0.9s_ease-out]">
          <Button
            className="h-10 px-5 rounded-md bg-gradient-to-r from-[#2942EE] via-[#5B3FE0] to-[#A855F7] text-white shadow-none transition-all duration-300 hover:shadow-[0_8px_24px_-8px_rgba(41,66,238,0.5)] hover:-translate-y-0.5 group"
            style={{ fontSize: 14, fontWeight: 500 }}
          >
            Book a demo <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button
            variant="outline"
            className={`h-10 px-5 rounded-md ${border} bg-white shadow-none hover:bg-[#fafafa] hover:border-[#A855F7]/40 transition-colors`}
            style={{ fontSize: 14, fontWeight: 500 }}
          >
            Watch tour
          </Button>
        </div>

        {/* Desktop / tablet ecosystem */}
        <div
          ref={containerRef}
          className="hidden md:block relative mx-auto mt-16"
          style={{ height: 820, maxWidth: 1200 }}
        >
          {/* Column header pills */}
          <div className="absolute top-0 left-[14%] -translate-x-1/2 z-30">
            <div className="px-4 py-1.5 rounded-full bg-white border border-[#2942EE]/30" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em" }}>
              <span className="text-[#2942EE]">● CUSTOMER EXPERIENCE</span>
            </div>
          </div>
          <div className="absolute top-0 left-[86%] -translate-x-1/2 z-30">
            <div className="px-4 py-1.5 rounded-full bg-white border border-[#A855F7]/30 whitespace-nowrap" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em" }}>
              <span className="text-[#A855F7]">● BUSINESS MANAGEMENT (CRM)</span>
            </div>
          </div>
          {/* connecting SVG curves */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${box.w} ${box.h}`}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="heroLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2942EE" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#A855F7" stopOpacity="0.5" />
              </linearGradient>
              <filter id="heroLineGlow">
                <feGaussianBlur stdDeviation="2" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {paths.map((d, i) => (
              <g key={i}>
                <path
                  d={d}
                  stroke="url(#heroLine)"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeDasharray="5 6"
                  fill="none"
                />
              </g>
            ))}
            {/* endpoint dots on cards */}
            {cardRefs.current.map((el, i) => {
              if (!el || !containerRef.current) return null;
              const r = el.getBoundingClientRect();
              const cRect = containerRef.current.getBoundingClientRect();
              const card = cards[i];
              const x = r.left - cRect.left + r.width * card.anchorX;
              const y = r.top - cRect.top + r.height * card.anchorY;
              return (
                <circle
                  key={`ep-${i}`}
                  cx={x}
                  cy={y}
                  r={4}
                  fill="#fff"
                  stroke={card.anchorX === 1 ? "#2942EE" : "#A855F7"}
                  strokeWidth={1.5}
                />
              );
            })}
          </svg>

          {/* Midpoint label pills on each connector */}
          {mids.map((m, i) => (
            <div
              key={`mid-${i}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 z-30 px-2.5 py-1 rounded-full bg-white border border-[#e6e6e6]"
              style={{
                left: m.x,
                top: m.y,
                fontSize: 11,
                fontWeight: 500,
                color: cards[i].anchorX === 1 ? "#2942EE" : "#A855F7",
                whiteSpace: "nowrap",
              }}
            >
              {cards[i].label}
            </div>
          ))}

          {/* travelling dots */}
          {paths.map((d, i) => (
            <div
              key={`dot-${i}`}
              className="absolute top-0 left-0 w-2 h-2 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, #A855F7 0%, rgba(168,85,247,0.6) 60%, transparent 100%)",
                boxShadow: "0 0 10px rgba(168,85,247,0.8)",
                offsetPath: `path('${d}')`,
                animation: `heroDot ${5 + (i % 3)}s linear ${i * 0.5}s infinite`,
              }}
            />
          ))}

          {/* Cards */}
          {cards.map((card, i) => (
            <HeroCard
              key={card.label}
              card={card}
              index={i}
              cardRef={(el) => (cardRefs.current[i] = el)}
            />
          ))}

          {/* Center node */}
          <div
            ref={centerRef}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
          >
            <div
              className="rounded-full bg-white/70 backdrop-blur-xl border border-[#A855F7]/30 flex flex-col items-center justify-center text-center p-6"
              style={{
                width: 240,
                height: 240,
                animation: "heroPulse 4s ease-in-out infinite",
              }}
            >
              <img src={logoImg} alt="BookBites" className="h-10 w-auto" />
              <p
                className={`mt-3 ${subtle} px-2`}
                style={{ fontSize: 12, lineHeight: 1.5 }}
              >
                Connect your business and customers through{" "}
                <span className="bg-gradient-to-r from-[#2942EE] to-[#A855F7] bg-clip-text text-transparent" style={{ fontWeight: 500 }}>
                  one platform
                </span>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Mobile vertical journey */}
        <div className="md:hidden mt-12 flex flex-col items-center gap-6">
          <div className="w-full">
            <Eyebrow>Customer Experience</Eyebrow>
            <div className="mt-3 grid gap-4">
              {cards.slice(0, 3).map((c) => (
                <div key={c.label} className={`${border} rounded-xl overflow-hidden bg-white relative`}>
                  <ImageWithFallback src={c.src} alt={c.label} className="w-full h-auto block" />
                  <div className="absolute left-2 bottom-2 px-2 py-1 rounded-md bg-white/95 border border-[#e6e6e6]" style={{ fontSize: 11, fontWeight: 500 }}>
                    <span className="bg-gradient-to-r from-[#2942EE] to-[#A855F7] bg-clip-text text-transparent">{c.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-full bg-white border border-[#A855F7]/30 p-6 flex flex-col items-center" style={{ animation: "heroPulse 4s ease-in-out infinite" }}>
            <img src={logoImg} alt="BookBites" className="h-8 w-auto" />
          </div>
          <div className="w-full">
            <Eyebrow>Business Management</Eyebrow>
            <div className="mt-3 grid gap-4">
              {cards.slice(3).map((c) => (
                <div key={c.label} className={`${border} rounded-xl overflow-hidden bg-white relative`}>
                  <ImageWithFallback src={c.src} alt={c.label} className="w-full h-auto block" />
                  <div className="absolute left-2 bottom-2 px-2 py-1 rounded-md bg-white/95 border border-[#e6e6e6]" style={{ fontSize: 11, fontWeight: 500 }}>
                    <span className="bg-gradient-to-r from-[#2942EE] to-[#A855F7] bg-clip-text text-transparent">{c.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturesOverview() {
  const { ref, isVisible } = useScrollAnimation();
  const features = [
    {
      icon: Sparkles,
      title: "Your Brand, Your Identity",
      desc: "Customize everything to deeply your business and values",
      color: "text-[#2942EE]",
      bgColor: "bg-[#2942EE]/10",
    },
    {
      icon: Calendar,
      title: "24/7 Online Booking",
      desc: "Let clients book anytime, anywhere, on any device",
      color: "text-[#A855F7]",
      bgColor: "bg-[#A855F7]/10",
    },
    {
      icon: Users,
      title: "More Bookings",
      desc: "Reach more clients and boost your revenue",
      color: "text-[#06B6D4]",
      bgColor: "bg-[#06B6D4]/10",
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      desc: "Always updated for bookings, reminders & notes",
      color: "text-[#F59E0B]",
      bgColor: "bg-[#F59E0B]/10",
    },
    {
      icon: BarChart3,
      title: "Business Growth",
      desc: "Powerful tools to manage, analyze and grow",
      color: "text-[#EC4899]",
      bgColor: "bg-[#EC4899]/10",
    },
  ];

  return (
    <section className="bg-gradient-to-b from-[#fafafa] to-white py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div ref={ref} className={`text-center mb-12 animate-on-scroll ${isVisible ? 'visible' : ''}`} style={isVisible ? { animationName: 'fadeInUp' } : {}}>
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-[#A855F7]" />
            <span className="text-[#A855F7]" style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              All-in-One Booking Solution
            </span>
          </div>
          <h2 className={ink} style={{ fontSize: 20, fontWeight: 600 }}>
            More Bookings. Happier clients. Simpler business.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {features.map((feature, idx) => (
            <div
              key={feature.title}
              className={`text-center animate-on-scroll ${isVisible ? 'visible' : ''}`}
              style={isVisible ? { animationName: 'fadeInUp', animationDelay: `${0.1 + idx * 0.1}s` } : {}}
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg ${feature.bgColor} mb-3`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className={ink} style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                {feature.title}
              </h3>
              <p className={subtle} style={{ fontSize: 13, lineHeight: 1.5 }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductShowcase() {
  const { ref, isVisible } = useScrollAnimation();
  const { ref: ref2, isVisible: isVisible2 } = useScrollAnimation();
  const tabs = [
    {
      key: "website",
      label: "Website Builder",
      icon: Globe,
      title: "Publish a booking website without writing a line of code.",
      desc: "Drag, drop, and ship a fully branded site with your services, photos, and prices.",
      bullets: ["Custom domains & branding", "Upload photos and videos", "Mobile-first templates"],
      image: websiteBuilderImg,
    },
    {
      key: "crm",
      label: "CRM Dashboard",
      icon: LayoutDashboard,
      title: "One dashboard for everything that runs your business.",
      desc: "Today's bookings, active services, new customers and revenue — all in one place.",
      bullets: ["Live activity & customer pipeline", "Granular permissions", "Built-in reviews"],
      image: crmDashboardImg,
    },
  ];

  return (
    <Section id="features">
      <div ref={ref} className={`max-w-2xl animate-on-scroll ${isVisible ? 'visible' : ''}`} style={isVisible ? { animationName: 'fadeInUp' } : {}}>
        <Eyebrow>Product</Eyebrow>
        <H2>Everything you need. Nothing you don't.</H2>
        <Lead>
          From your first booking to your thousandth, BookBikes gives you focused tools
          to delight customers and grow revenue.
        </Lead>
      </div>

      <div ref={ref2} className={`animate-on-scroll ${isVisible2 ? 'visible' : ''}`} style={isVisible2 ? { animationName: 'fadeInUp', animationDelay: '0.2s' } : {}}>
      <Tabs defaultValue="website" className="mt-12">
        <TabsList
          className={`bg-white p-0 h-auto flex flex-wrap gap-0 ${border} rounded-md overflow-hidden`}
        >
          {tabs.map((t, i) => (
            <TabsTrigger
              key={t.key}
              value={t.key}
              className={`rounded-none px-4 py-2.5 transition-all duration-300 ${
                i !== 0 ? "border-l border-[#e6e6e6]" : ""
              } data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50/60 data-[state=active]:to-purple-50/40 data-[state=active]:text-[#2942EE] data-[state=active]:shadow-none shadow-none`}
              style={{ fontSize: 14, fontWeight: 500 }}
            >
              <t.icon className="w-3.5 h-3.5 mr-1.5" />
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((t) => (
          <TabsContent key={t.key} value={t.key} className="mt-10">
            <div className="grid lg:grid-cols-2 gap-10 items-start">
              <div>
                <h3
                  className={ink}
                  style={{ fontSize: 24, lineHeight: 1.2, fontWeight: 600, letterSpacing: "-0.01em" }}
                >
                  {t.title}
                </h3>
                <p className={`mt-3 ${subtle}`} style={{ fontSize: 16, lineHeight: 1.6 }}>
                  {t.desc}
                </p>
                <ul className="mt-6 space-y-3">
                  {t.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5" style={{ fontSize: 14 }}>
                      <Check className="w-4 h-4 mt-0.5 text-[#111]" />
                      <span className={ink}>{b}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant="ghost"
                  className="mt-7 h-9 px-0 hover:bg-transparent"
                  style={{ fontSize: 14, fontWeight: 500 }}
                >
                  Explore {t.label} <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
              <div className={`${border} rounded-lg overflow-hidden bg-white`}>
                <ImageWithFallback src={t.image} alt={t.label} className="w-full h-auto block" />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
      </div>
    </Section>
  );
}

function CalendarSection() {
  const { ref, isVisible } = useScrollAnimation();
  const { ref: ref2, isVisible: isVisible2 } = useScrollAnimation();
  return (
    <Section id="calendar">
      <div ref={ref} className={`max-w-2xl animate-on-scroll ${isVisible ? 'visible' : ''}`} style={isVisible ? { animationName: 'fadeInLeft' } : {}}>
        <Eyebrow>Calendar</Eyebrow>
        <H2>A calendar your team will actually love.</H2>
        <Lead>
          Day, week and month views with drag-and-drop, smart filters and one-tap
          booking creation.
        </Lead>
      </div>

      <div ref={ref2} className={`mt-12 grid lg:grid-cols-5 gap-5 animate-on-scroll ${isVisible2 ? 'visible' : ''}`} style={isVisible2 ? { animationName: 'scaleIn', animationDelay: '0.2s' } : {}}>
        <div className={`lg:col-span-3 ${border} rounded-lg overflow-hidden bg-white`}>
          <ImageWithFallback src={shot6} alt="Weekly calendar" className="w-full h-auto block" />
        </div>
        <div className="lg:col-span-2 grid gap-5">
          <div className={`${border} rounded-lg overflow-hidden bg-white`}>
            <ImageWithFallback src={shot7} alt="Daily view" className="w-full h-auto block" />
          </div>
          <div className={`${border} rounded-lg overflow-hidden bg-white`}>
            <ImageWithFallback src={shot8} alt="Monthly view" className="w-full h-auto block" />
          </div>
        </div>
      </div>

      <div className={`mt-10 ${border} rounded-lg grid sm:grid-cols-2 lg:grid-cols-4 overflow-hidden`}>
        {[
          { icon: Calendar, t: "Daily, weekly & monthly", s: "Switch views instantly." },
          { icon: ArrowRight, t: "Drag & drop bookings", s: "Reschedule in one motion." },
          { icon: Clock, t: "Status filters", s: "Find anything in seconds." },
          { icon: Users, t: "Provider schedules", s: "All staff in one timeline." },
        ].map((f, i) => {
          const colors = ["text-[#2942EE]", "text-[#A855F7]", "text-[#06B6D4]", "text-[#EC4899]"];
          return (
          <div
            key={f.t}
            className={`p-5 bg-white transition-all duration-300 hover:bg-gradient-to-br hover:from-blue-50/30 hover:to-purple-50/20 ${i !== 0 ? "border-t sm:border-t-0 sm:border-l border-[#e6e6e6]" : ""} ${i >= 2 ? "lg:border-l border-[#e6e6e6]" : ""}`}
          >
            <f.icon className={`w-4 h-4 ${colors[i]}`} />
            <div className={`mt-3 ${ink}`} style={{ fontSize: 14, fontWeight: 500 }}>
              {f.t}
            </div>
            <div className={`mt-1 ${subtle}`} style={{ fontSize: 14 }}>
              {f.s}
            </div>
          </div>
          );
        })}
      </div>
    </Section>
  );
}

function GrowthSection() {
  const { ref, isVisible } = useScrollAnimation();
  const { ref: ref2, isVisible: isVisible2 } = useScrollAnimation();
  const data = [
    { m: "Jan", r: 18 },
    { m: "Feb", r: 24 },
    { m: "Mar", r: 31 },
    { m: "Apr", r: 38 },
    { m: "May", r: 49 },
    { m: "Jun", r: 58 },
    { m: "Jul", r: 71 },
    { m: "Aug", r: 86 },
  ];
  const bar = [
    { d: "Mon", v: 24 },
    { d: "Tue", v: 32 },
    { d: "Wed", v: 28 },
    { d: "Thu", v: 41 },
    { d: "Fri", v: 56 },
    { d: "Sat", v: 64 },
    { d: "Sun", v: 38 },
  ];
  const tickStyle = { fontSize: 12, fill: "#666" };
  return (
    <Section>
      <div ref={ref} className={`max-w-2xl animate-on-scroll ${isVisible ? 'visible' : ''}`} style={isVisible ? { animationName: 'fadeInRight' } : {}}>
        <Eyebrow>Growth</Eyebrow>
        <H2>Built to make your business measurably bigger.</H2>
        <Lead>
          Operators see more bookings, fewer no-shows and dramatic time savings within
          their first 30 days.
        </Lead>
      </div>

      <div ref={ref2} className={`mt-12 grid lg:grid-cols-3 gap-5 animate-on-scroll ${isVisible2 ? 'visible' : ''}`} style={isVisible2 ? { animationName: 'rotateIn', animationDelay: '0.15s' } : {}}>
        <Card className={`p-6 rounded-lg lg:col-span-2 ${border} shadow-none bg-white`}>
          <div className="flex items-center justify-between">
            <div>
              <div className={subtle} style={{ fontSize: 14 }}>Monthly revenue</div>
              <div className={`mt-1 ${ink}`} style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>
                $248,910
              </div>
            </div>
            <div
              className="rounded-md px-2.5 py-1 flex items-center gap-1 bg-gradient-to-r from-[#2942EE]/10 to-[#A855F7]/10 border border-[#2942EE]/20 text-[#2942EE]"
              style={{ fontSize: 12, fontWeight: 500 }}
            >
              <TrendingUp className="w-3 h-3" /> +42% YoY
            </div>
          </div>
          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="m" stroke="#999" tick={tickStyle} tickLine={false} axisLine={false} />
                <YAxis stroke="#999" tick={tickStyle} tickLine={false} axisLine={false} />
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2942EE" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#A855F7" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="r" stroke="#2942EE" fill="url(#revGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className={`p-6 rounded-lg ${border} shadow-none bg-white`}>
          <div className={subtle} style={{ fontSize: 14 }}>Bookings this week</div>
          <div className={`mt-1 ${ink}`} style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em" }}>
            1,284
          </div>
          <div className="h-40 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bar} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
                <XAxis dataKey="d" stroke="#999" tick={tickStyle} tickLine={false} axisLine={false} />
                <YAxis hide />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A855F7" />
                    <stop offset="100%" stopColor="#2942EE" />
                  </linearGradient>
                </defs>
                <Bar dataKey="v" fill="url(#barGradient)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className={`mt-4 grid grid-cols-2 ${border} rounded-md overflow-hidden`}>
            <div className="p-3 bg-white">
              <div className={subtle} style={{ fontSize: 12 }}>No-shows</div>
              <div className={`mt-0.5 ${ink}`} style={{ fontSize: 14, fontWeight: 500 }}>−64%</div>
            </div>
            <div className="p-3 bg-white border-l border-[#e6e6e6]">
              <div className={subtle} style={{ fontSize: 12 }}>Time saved</div>
              <div className={`mt-0.5 ${ink}`} style={{ fontSize: 14, fontWeight: 500 }}>14h / wk</div>
            </div>
          </div>
        </Card>
      </div>
    </Section>
  );
}

/*
  const plans = [
    {
      name: "Starter",
      price: "$29",
      sub: "For solo operators getting started.",
      features: ["1 provider", "Booking website", "Unlimited bookings", "Email reminders"],
      cta: "Start free trial",
      featured: false,
    },
    {
      name: "Professional",
      price: "$79",
      sub: "Most popular for growing teams.",
      features: ["Up to 10 providers", "Full CRM & reviews", "SMS + email reminders", "Analytics", "Custom domain"],
      cta: "Start free trial",
      featured: true,
    },
    {
      name: "Business",
      price: "$159",
      sub: "For multi-location, fast-scaling teams.",
      features: ["Unlimited providers", "Multi-location", "Roles & permissions", "Priority support"],
      cta: "Start free trial",
      featured: false,
    },
    {
      name: "Enterprise",
      price: "Custom",
      sub: "For chains & franchises.",
      features: ["SSO & SCIM", "Dedicated success manager", "Custom integrations", "SLA & uptime"],
      cta: "Talk to sales",
      featured: false,
    },
  ];
  return (
    <Section id="pricing">
      <div className="max-w-2xl">
        <Eyebrow>Pricing</Eyebrow>
        <H2>Simple pricing that scales with you.</H2>
        <Lead>Every plan includes a 14-day free trial. Cancel anytime.</Lead>
      </div>

      <div className={`mt-12 grid md:grid-cols-2 lg:grid-cols-4 ${border} rounded-lg overflow-hidden`}>
        {plans.map((p, i) => (
          <div
            key={p.name}
            className={`p-6 bg-white flex flex-col ${
              i !== 0 ? "border-t md:border-t-0 md:border-l border-[#e6e6e6]" : ""
            } ${i >= 2 ? "lg:border-l border-[#e6e6e6]" : ""} ${
              p.featured ? "bg-[#fafafa]" : ""
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={ink} style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
              {p.featured && (
                <span
                  className={`${border} rounded px-1.5 py-0.5 ${subtle}`}
                  style={{ fontSize: 11, fontWeight: 500 }}
                >
                  Popular
                </span>
              )}
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className={ink} style={{ fontSize: 32, fontWeight: 600, letterSpacing: "-0.02em" }}>
                {p.price}
              </span>
              {p.price !== "Custom" && (
                <span className={subtle} style={{ fontSize: 14 }}>/mo</span>
              )}
            </div>
            <p className={`mt-2 ${subtle}`} style={{ fontSize: 14, lineHeight: 1.5 }}>{p.sub}</p>
            <ul className="mt-6 space-y-2.5 flex-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2" style={{ fontSize: 14 }}>
                  <Check className="w-3.5 h-3.5 mt-1 text-[#111]" />
                  <span className={ink}>{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className={
                p.featured
                  ? "mt-6 h-9 rounded-md bg-gradient-to-r from-[#2942EE] to-[#1e32b8] text-white hover:opacity-90 shadow-none transition-opacity"
                  : `mt-6 h-9 rounded-md ${border} bg-white hover:bg-[#fafafa] text-[#111] shadow-none`
              }
              variant={p.featured ? "default" : "outline"}
              style={{ fontSize: 14, fontWeight: 500 }}
            >
              {p.cta}
            </Button>
          </div>
        ))}
      </div>
    </Section>
  );
}
*/

function FAQ() {
  const { ref, isVisible } = useScrollAnimation();
  const { ref: ref2, isVisible: isVisible2 } = useScrollAnimation();
  const items = [
    {
      q: "How quickly can I get my booking website live?",
      a: "Most operators publish in under an hour. Pick a template, upload your photos, list your services, and you're ready.",
    },
    {
      q: "Can I customize everything to match my brand?",
      a: "Yes. Colors, typography, photography, copy, domain — everything is yours. No 'powered by' badges on any paid plan.",
    },
    {
      q: "How do bookings, payments and reminders work?",
      a: "Customers book online in seconds. We send automatic SMS and email reminders, take deposits if you want, and sync everything to your dashboard.",
    },
    {
      q: "Can I invite my team and control their access?",
      a: "Yes. Add unlimited staff on Business and above, with granular roles and permissions.",
    },
    {
      q: "Will my analytics actually be useful?",
      a: "We focus on the metrics that move the needle: revenue, retention, no-show rate, top services and per-provider performance.",
    },
    {
      q: "What if I need help setting things up?",
      a: "Every plan includes free onboarding support. Business and Enterprise get a dedicated success manager.",
    },
  ];
  return (
    <Section id="faq">
      <div className="max-w-3xl mx-auto">
        <div ref={ref} className={`text-center animate-on-scroll ${isVisible ? 'visible' : ''}`} style={isVisible ? { animationName: 'scaleIn' } : {}}>
          <Eyebrow>FAQ</Eyebrow>
          <H2>Questions, answered.</H2>
        </div>
        <div ref={ref2} className={`animate-on-scroll ${isVisible2 ? 'visible' : ''}`} style={isVisible2 ? { animationName: 'fadeInUp', animationDelay: '0.3s' } : {}}>
          <Accordion type="single" collapsible className={`mt-10 ${border} rounded-lg bg-white`}>
            {items.map((i, idx) => (
              <AccordionItem
                key={i.q}
                value={`i-${idx}`}
                className={`${idx !== 0 ? "border-t border-[#e6e6e6]" : ""} border-b-0 px-5`}
              >
                <AccordionTrigger
                  className={`text-left ${ink} hover:no-underline py-4`}
                  style={{ fontSize: 14, fontWeight: 500 }}
                >
                  {i.q}
                </AccordionTrigger>
                <AccordionContent className={subtle} style={{ fontSize: 14, lineHeight: 1.6 }}>
                  {i.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </Section>
  );
}

function Contact() {
  const { ref, isVisible } = useScrollAnimation();
  return (
    <Section id="contact">
      <div ref={ref} className={`grid lg:grid-cols-2 ${border} rounded-lg overflow-hidden bg-white animate-on-scroll ${isVisible ? 'visible' : ''}`} style={isVisible ? { animationName: 'slideUp' } : {}}>
        <div className="p-10">
          <Eyebrow>Contact</Eyebrow>
          <H2>Talk to us. We'll get you live this week.</H2>
          <p className={`mt-3 ${subtle}`} style={{ fontSize: 16, lineHeight: 1.6 }}>
            Real humans, fast replies.
          </p>
          <div className="mt-8 space-y-3" style={{ fontSize: 14 }}>
            <div className={`flex items-center gap-3 ${ink} transition-colors hover:text-[#2942EE]`}>
              <Mail className="w-4 h-4 text-[#2942EE]" /> hello@bookbikes.app
            </div>
            <div className={`flex items-center gap-3 ${ink} transition-colors hover:text-[#A855F7]`}>
              <Phone className="w-4 h-4 text-[#A855F7]" /> +1 (415) 555-0142
            </div>
            <div className={`flex items-center gap-3 ${ink} transition-colors hover:text-[#06B6D4]`}>
              <MapPin className="w-4 h-4 text-[#06B6D4]" /> San Francisco · London · Lisbon
            </div>
          </div>
        </div>

        <div className="p-10 border-t lg:border-t-0 lg:border-l border-[#e6e6e6]">
          <div className={ink} style={{ fontSize: 16, fontWeight: 500 }}>Book a demo</div>
          <p className={`mt-1 ${subtle}`} style={{ fontSize: 14 }}>
            A 20-minute walk through your use case.
          </p>
          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <Input placeholder="First name" className={`${border} shadow-none rounded-md h-9`} style={{ fontSize: 14 }} />
            <Input placeholder="Last name" className={`${border} shadow-none rounded-md h-9`} style={{ fontSize: 14 }} />
            <Input placeholder="Work email" className={`${border} shadow-none rounded-md h-9 sm:col-span-2`} style={{ fontSize: 14 }} />
            <Input placeholder="Business name" className={`${border} shadow-none rounded-md h-9 sm:col-span-2`} style={{ fontSize: 14 }} />
            <Textarea
              placeholder="Tell us about your business…"
              className={`${border} shadow-none rounded-md sm:col-span-2`}
              style={{ fontSize: 14 }}
              rows={3}
            />
          </div>
          <Button
            className="mt-5 w-full h-9 rounded-md bg-gradient-to-r from-[#2942EE] via-[#5B3FE0] to-[#A855F7] text-white shadow-none transition-all duration-300 hover:shadow-[0_8px_24px_-8px_rgba(168,85,247,0.5)] hover:-translate-y-0.5"
            style={{ fontSize: 14, fontWeight: 500 }}
          >
            Request demo <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </div>
    </Section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#e6e6e6] bg-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div>
          <img
            src={logoImg}
            alt="BookBikes by Cubites"
            className="h-8 w-auto"
          />
          <p className={`mt-4 max-w-xs ${subtle}`} style={{ fontSize: 14, lineHeight: 1.6 }}>
            The all-in-one platform booking-based businesses use to run beautifully and
            grow predictably.
          </p>
        </div>
      </div>
      <div
        className={`max-w-6xl mx-auto px-6 py-6 border-t border-[#e6e6e6] flex flex-col sm:flex-row items-center justify-between gap-3 ${subtle}`}
        style={{ fontSize: 14 }}
      >
        <div>© 2026 BookBikes by Cubites. All rights reserved.</div>
        <div>Made with care for operators worldwide.</div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-white text-[#111]" style={{ fontSize: 14 }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(60px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(80px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes rotateIn {
          from { opacity: 0; transform: perspective(1000px) rotateX(20deg); }
          to { opacity: 1; transform: perspective(1000px) rotateX(0deg); }
        }
        .animate-on-scroll {
          opacity: 0;
        }
        .animate-on-scroll.visible {
          animation-duration: 0.9s;
          animation-fill-mode: both;
          animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
      <Nav />
      <Hero />
      <FeaturesOverview />
      <ProductShowcase />
      <CalendarSection />
      <GrowthSection />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
}
