import StatsGrid from '@/components/StatsGrid';
import MemberTable from '@/components/MemberTable';

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-brand-navy">Society Overview</h1>
        <p className="text-gray-500">Welcome back, Admin</p>
      </header>

      {/* The Stats Logic */}
      <StatsGrid />

      {/* The Member List Logic */}
      <div>
        <h2 className="text-lg font-bold text-brand-navy mb-4 font-numeric">Registered Members</h2>
        <MemberTable />
      </div>
      {/* Next we will add the Recent Transactions table here */}
    </div>
  );
}