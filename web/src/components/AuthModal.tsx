"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("demo@autopitch.ai");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-lg border">
        <h3 className="text-lg font-semibold">Sign In</h3>
        <p className="text-sm text-gray-600 mt-1">Simulemos un inicio de sesión con email.</p>
        <div className="mt-4">
          <label className="block text-xs text-gray-600 mb-1">Email</label>
          <input
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="mt-6 flex items-center justify-end gap-2">
          <button className="h-9 px-4 rounded-md border" onClick={onClose}>Cancel</button>
          <button
            className="h-9 px-4 rounded-md bg-gray-900 text-white"
            onClick={() => {
              signIn(email);
              onClose();
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}


