'use client';

import { Users, Shield, Plus, Building2, UserCog } from 'lucide-react';

export default function MembersPage() {
  const members = [
    { id: 1, name: 'Alice Smith', email: 'alice@neuralflow.ai', role: 'Workspace Admin', status: 'Active', mfa: true },
    { id: 2, name: 'Bob Jones', email: 'bob@neuralflow.ai', role: 'Developer', status: 'Active', mfa: true },
    { id: 3, name: 'Charlie Brown', email: 'charlie@neuralflow.ai', role: 'Viewer', status: 'Invited', mfa: false },
  ];

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Users className="w-8 h-8 text-purple-400" />
          Identity & Members
        </h1>
        <p className="text-zinc-400 mt-2">Manage workspace members, roles, and SAML/SCIM identity provider integration.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
            <span className="text-xs font-bold px-2 py-1 rounded bg-blue-900/50 text-blue-400">Enterprise</span>
          </div>
          <Building2 className="w-8 h-8 text-blue-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">SAML SSO & Directory Sync</h2>
          <p className="text-sm text-zinc-400 mb-4">
            Identity is currently managed via Okta (SCIM). Group mappings automatically assign roles to incoming members.
          </p>
          <button className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors border border-zinc-800">
            Configure IdP Settings
          </button>
        </div>
        
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <UserCog className="w-8 h-8 text-emerald-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Role Based Access Control</h2>
          <p className="text-sm text-zinc-400 mb-4">
            Fine-grained permissions mapped to roles like Workspace Admin, Developer, Editor, and Viewer.
          </p>
          <button className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-medium rounded-lg transition-colors border border-zinc-800">
            Manage Custom Roles
          </button>
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" /> Active Members
          </h2>
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Invite Member
          </button>
        </div>
        <table className="w-full text-left text-sm text-zinc-300">
          <thead className="bg-zinc-900/80 text-xs text-zinc-500 uppercase border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">MFA</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {members.map(member => (
              <tr key={member.id} className="hover:bg-zinc-900/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-white">{member.name}</div>
                  <div className="text-xs text-zinc-500">{member.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded text-xs border border-zinc-700">
                    {member.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${member.status === 'Active' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-yellow-900/30 text-yellow-400'}`}>
                    {member.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {member.mfa ? <span className="text-emerald-400">Enabled</span> : <span className="text-red-400">Disabled</span>}
                </td>
                <td className="px-6 py-4 text-blue-400 hover:text-blue-300 cursor-pointer text-xs font-bold uppercase tracking-wider">
                  Manage
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
