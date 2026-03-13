'use client';
import { useEffect, useState } from 'react';

export default function StatsGrid() {
  const [stats, setStats] = useState({ total_members: 0, active_members: 0, inactive_members: 0 });
  const [loading, setLoading] = useState(true);
  const API_BACKEND = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch(`${API_BACKEND}/admin-stats`, { cache: 'no-store' });
        const data = await response.json();
        setStats(data);
      } catch (err) {
        console.error("Connection to Backend failed");
      } finally {
        // Shimmer effect for at least 800ms for that "Premium" feel
        setTimeout(() => setLoading(false), 800);
      }
    }
    loadData();
  }, []);

  const cards = [
    { label: "Total Members", value: stats.total_members, color: "text-brand-navy" },
    { label: "Active", value: stats.active_members, color: "text-action-success" },
    { label: "Inactive", value: stats.inactive_members, color: "text-action-danger" }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-8">
      {cards.map((card, index) => (
        <div key={index} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-32 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{card.label}</span>
          {loading ? (
            <div className="h-10 w-24 skeleton rounded-lg"></div> // Skeleton from your CSS
          ) : (
            <h2 className={`text-4xl font-bold font-numeric ${card.color}`}>{card.value}</h2>
          )}
        </div>
      ))}
    </div>
  );
}