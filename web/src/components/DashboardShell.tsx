import Sidebar from "@/components/Sidebar";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[260px_1fr] h-screen overflow-hidden">
      <div className="h-screen sticky top-0">
        <Sidebar />
      </div>
      <main className="px-8 py-10 h-screen overflow-y-auto">
        <div className="max-w-[1200px] mx-auto">{children}</div>
      </main>
    </div>
  );
}


