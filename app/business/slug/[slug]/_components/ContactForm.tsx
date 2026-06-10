"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import toast from "react-hot-toast";
import { Service } from "@/types";
import { createContact } from "@/services";
import { ELEGANZA } from "@/lib/publicBrand";
import { slideFromRight, fadeUp, VP } from "../_constants";

interface ContactFormProps {
  services?: Service[];
  slug: string;
  businessId: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Public "Send a message" form shown in the homepage contact section. It uses
 * the public `/contact` endpoint so logged-out visitors can reach the business
 * without signing in. Subject + Message are folded into the request `notes`.
 */
export function ContactForm({ services, slug, businessId }: ContactFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // The public contact endpoint is keyed to a service; use the featured one.
  const serviceId = services?.[0]?.id ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !phone.trim() || !message.trim()) {
      toast.error("Please fill in your name, email, phone and message.");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!serviceId) {
      toast.error("Sorry, messaging is unavailable right now.");
      return;
    }

    const [firstName, ...rest] = name.trim().split(/\s+/);
    const lastName = rest.join(" ") || firstName;
    const notes = subject.trim()
      ? `Subject: ${subject.trim()}\n\n${message.trim()}`
      : message.trim();

    try {
      setSubmitting(true);
      await createContact(
        {
          serviceId,
          firstName,
          lastName,
          email: email.trim(),
          phone: phone.trim(),
          notes,
        },
        slug,
        businessId,
      );
      toast.success("Message sent! We'll get back to you soon.");
      setName("");
      setEmail("");
      setPhone("");
      setSubject("");
      setMessage("");
    } catch (err) {
      toast.error("Could not send your message. Please try again.");
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: ELEGANZA.surfaceMuted,
    color: ELEGANZA.ink,
    border: `1px solid transparent`,
  };

  return (
    <motion.div
      variants={slideFromRight}
      initial="hidden"
      whileInView="visible"
      viewport={VP}
      className="rounded-xl p-7 md:p-8 shadow-sm"
      style={{
        backgroundColor: ELEGANZA.surface,
        border: `1px solid ${ELEGANZA.border}`,
      }}
    >
      <motion.h3
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={VP}
        className="uppercase mb-7 tracking-[0.3em]"
        style={{ fontSize: "1.15rem", color: ELEGANZA.inkMuted }}
      >
        Send a Message
      </motion.h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            autoComplete="name"
            className="w-full px-4 py-3.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            style={inputStyle}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            autoComplete="email"
            className="w-full px-4 py-3.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            style={inputStyle}
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
            autoComplete="tel"
            className="w-full px-4 py-3.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            style={inputStyle}
          />
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full px-4 py-3.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
            style={inputStyle}
          />
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Message"
          rows={5}
          className="w-full px-4 py-3.5 rounded-lg text-sm resize-y min-h-[120px] focus:outline-none focus:ring-2 focus:ring-black/10"
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-lg text-white font-semibold text-sm tracking-wide transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: ELEGANZA.cta }}
          onMouseEnter={(e) => {
            if (!submitting)
              e.currentTarget.style.backgroundColor = ELEGANZA.ctaHover;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = ELEGANZA.cta;
          }}
        >
          <Send className="w-4 h-4" />
          {submitting ? "Sending..." : "Send message"}
        </button>
      </form>
    </motion.div>
  );
}
