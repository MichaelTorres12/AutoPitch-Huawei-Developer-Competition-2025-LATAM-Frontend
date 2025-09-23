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
      <main className="h-screen overflow-y-auto">
        <div className="">{children}</div>
      </main>
    </div>
  );
}


