"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useLanguage } from "@/context/LanguageContext";
import StatsGrid from "@/components/dashboard/StatsGrid";
import MemberTable from "@/components/MemberTable";

const TRANSLATIONS = {
    EN: {
        recentRegistrations: "Recent Registrations",
        viewDirectory: "View Directory",
    },
    MR: {
        recentRegistrations: "अलीकडील नोंदणी",
        viewDirectory: "सर्व यादी",
    },
};

export default function AdminView() {
    const { language } = useLanguage();
    const t = TRANSLATIONS[language] || TRANSLATIONS.EN;

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500 delay-150 fill-mode-both">

            {/* StatsGrid handles its own internal loading state now, no Suspense needed here */}
            <StatsGrid />

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-brand-navy flex items-center gap-2">
                        <span className="h-5 w-1 bg-brand-blue rounded-full" aria-hidden="true" />
                        {t.recentRegistrations}
                    </h2>

                    <Link
                        href="/members"
                        className="text-brand-blue text-xs font-bold hover:text-brand-navy transition-colors uppercase tracking-widest"
                    >
                        {t.viewDirectory} &rarr;
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Keep Suspense here ONLY if MemberTable is fetching data differently, 
                        otherwise, MemberTable should also manage its own loading state like StatsGrid. */}
                    <Suspense fallback={<TableSkeleton />}>
                        <MemberTable limit={5} />
                    </Suspense>
                </div>
            </section>
        </div>
    );
}

// Removed the unused StatsGridSkeleton to keep the file clean

function TableSkeleton() {
    return (
        <div className="w-full h-64 bg-gray-100 animate-pulse" />
    );
}