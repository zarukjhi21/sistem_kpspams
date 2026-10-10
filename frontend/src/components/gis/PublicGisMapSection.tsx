"use client";

import React from "react";
import dynamic from "next/dynamic";

const PublicGisMap = dynamic(
  () => import("./PublicGisMap").then((mod) => mod.PublicGisMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[380px] sm:h-[480px] lg:h-[520px] w-full rounded-2xl sm:rounded-3xl bg-slate-900/60 border border-slate-800 animate-pulse flex flex-col items-center justify-center space-y-3 text-slate-400">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <span className="text-xs font-semibold">Memuat Peta Spasial Jaringan Air Bersih...</span>
      </div>
    ),
  }
);

export function PublicGisMapSection() {
  return <PublicGisMap />;
}
