'use client';
import { useEffect, useState } from 'react';

export default function MemberTable() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_BACKEND = process.env.NEXT_PUBLIC_API_URL;


    useEffect(() => {
        async function fetchMembers() {
            try {
                const response = await fetch(`${API_BACKEND}/api/v1/members/`, {
                    cache: 'no-store',
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch: ${response.status}`);
                }

                const data = await response.json();
                setMembers(data); // Or whatever your state setter is named

            } catch (err) {
                console.error("MemberTable fetch failed:", err);
                // Handle your error state here
            } finally {
                setLoading(false);
            }
        }
        fetchMembers();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-400">Loading Members...</div>;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* This wrapper allows internal scrolling on mobile */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-150">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">Account</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">Member Name</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase">Status</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Balance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {members.map((m) => (
                            <tr key={m.account_number} className="hover:bg-blue-50/30 transition-colors">
                                <td className="p-4 font-mono text-sm text-brand-blue">{m.account_number}</td>
                                <td className="p-4 font-semibold text-brand-navy">{m.full_name}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${m.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {m.is_active ? 'Active' : 'Overdue'}
                                    </span>
                                </td>
                                <td className="p-4 text-right font-bold text-brand-navy">
                                    ₹{m.balance.toLocaleString('en-IN')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}