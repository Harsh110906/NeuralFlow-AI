export const dynamic = 'force-dynamic';

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { 
  LayoutDashboard, 
  Workflow, 
  Bot, 
  Activity, 
  LineChart, 
  Settings, 
  CreditCard,
  Box,
  ShieldCheck
} from "lucide-react";
import { CopilotChat } from "../../components/copilot/CopilotChat";

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Workflows', href: '/workflows', icon: Workflow },
  { name: 'Agent Studio', href: '/agents', icon: Bot },
  { name: 'Executions', href: '/executions', icon: Activity },
  { name: 'Governance', href: '/approvals', icon: ShieldCheck },
  { name: 'Observatory', href: '/observatory', icon: LineChart },
];

const secondaryNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Billing', href: '/billing', icon: CreditCard },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950">
      
      {/* Sidebar */}
      <div className="hidden md:flex w-64 flex-col bg-zinc-900 border-r border-zinc-800">
        <div className="flex h-16 items-center px-6 border-b border-zinc-800">
          <Link href="/dashboard" className="flex items-center gap-2 font-mono font-bold text-lg text-white">
            <Box className="h-5 w-5 text-yellow-500" />
            NeuralFlow
          </Link>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-8">
          <nav className="flex flex-col gap-1">
            <div className="text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-3">Platform</div>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
          
          <nav className="flex flex-col gap-1 mt-auto">
            <div className="text-xs font-mono font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-3">Workspace</div>
            {secondaryNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="flex h-16 items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 backdrop-blur">
          <div className="flex items-center gap-4">
            <div className="text-sm font-mono text-zinc-400">
              Workspace <span className="text-zinc-600 mx-2">/</span> <span className="text-white">Production</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-8 h-8 rounded-md" } }} />
          </div>
        </header>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 p-6 relative">
          {children}
        </main>
      </div>
      
      {/* Floating Copilot */}
      <CopilotChat />
    </div>
  );
}
