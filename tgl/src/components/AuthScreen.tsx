import React, { useState } from "react";
import { SignIn, SignUp } from "@clerk/clerk-react";
import { Sparkles, ShieldCheck } from "lucide-react";

export const AuthScreen: React.FC = () => {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 selection:bg-blue-600 selection:text-white">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-md mb-3">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          RADIX
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
          Intelligent career benchmarking and job readiness platform.
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="w-full flex justify-center">
          {authMode === "signin" ? (
            <div className="w-full flex flex-col items-center">
              <SignIn routing="hash" />
              <div className="mt-4 text-center">
                <button
                  onClick={() => setAuthMode("signup")}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Don't have an account? <span className="font-semibold underline">Sign up</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              <SignUp routing="hash" />
              <div className="mt-4 text-center">
                <button
                  onClick={() => setAuthMode("signin")}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Already have an account? <span className="font-semibold underline">Sign in</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security badge footer */}
        <div className="mt-6 text-center text-[11px] text-slate-400 flex items-center justify-center gap-3">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Encrypted Session</span>
          </span>
          <span>•</span>
          <span>SOC 2 Type II Certified Auth</span>
        </div>
      </div>
    </div>
  );
};
