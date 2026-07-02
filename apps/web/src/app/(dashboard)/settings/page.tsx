import Link from 'next/link';

export default function SettingsPage() {
  const sections = [
    { name: 'Developer Settings', description: 'Manage API keys and service accounts.', href: '/settings/developer', icon: '💻' },
    { name: 'Members & Roles', description: 'Manage your workspace team members.', href: '/settings/members', icon: '👥' },
    { name: 'Audit Logs', description: 'View security and action logs.', href: '/settings/audit', icon: '📝' },
    { name: 'Feature Flags', description: 'Manage experimental features.', href: '/settings/features', icon: '🚩' },
  ];

  return (
    <div className="p-8 text-gray-900 dark:text-white max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
      <p className="text-gray-500 dark:text-zinc-400 mb-8">Manage your workspace configuration and team members.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map(section => (
          <Link key={section.href} href={section.href} className="block border border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-950 rounded-xl p-6 hover:border-blue-500 transition-colors text-gray-900 dark:text-white">
            <div className="text-3xl mb-4">{section.icon}</div>
            <h2 className="text-xl font-semibold mb-2">{section.name}</h2>
            <p className="text-gray-500 dark:text-zinc-400">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
