// 'use client';

// import Link from 'next/link';
// import { useAuthStore } from '@/src/lib/auth';
// import PageHeader from '@/components/PageHeader';

// export default function ProfilePage() {
//   const user = useAuthStore((s) => s.user);
//   if (!user) return null;

//   return (
//     <div>
//       <PageHeader
//         title="Your Profile"
//         subtitle="Account details and current permissions."
//         crumbs={[{ href: '/dashboard', label: 'Overview' }, { label: 'Profile' }]}
//         actions={
//           <Link href="/dashboard/change-password" className="btn-primary" data-testid="profile-change-pwd-btn">
//             Change Password
//           </Link>
//         }
//       />

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <div className="card p-6 md:col-span-2">
//           <div className="text-xs font-semibold uppercase text-slate-500">Account</div>
//           <dl className="mt-4 space-y-3 text-sm">
//             <div className="flex justify-between border-b border-slate-100 pb-2">
//               <dt className="text-slate-500">Full name</dt>
//               <dd className="font-medium text-ink" data-testid="profile-name">{user.firstName} {user.lastName}</dd>
//             </div>
//             <div className="flex justify-between border-b border-slate-100 pb-2">
//               <dt className="text-slate-500">Email</dt>
//               <dd className="font-medium text-ink" data-testid="profile-email">{user.email}</dd>
//             </div>
//             <div className="flex justify-between border-b border-slate-100 pb-2">
//               <dt className="text-slate-500">Company</dt>
//               <dd className="font-medium text-ink" data-testid="profile-company">
//                 {user.company?.name || '— (platform-level)'}
//               </dd>
//             </div>
//             <div className="flex justify-between border-b border-slate-100 pb-2">
//               <dt className="text-slate-500">Role</dt>
//               <dd className="font-medium text-ink" data-testid="profile-role">{user.role.name}</dd>
//             </div>
//             <div className="flex justify-between">
//               <dt className="text-slate-500">Status</dt>
//               <dd>
//                 <span className={user.status === 'ACTIVE' ? 'badge-green' : 'badge-red'}>
//                   {user.status}
//                 </span>
//               </dd>
//             </div>
//           </dl>
//         </div>

//         <div className="card p-6">
//           <div className="text-xs font-semibold uppercase text-slate-500">
//             Permissions ({user.permissions.length})
//           </div>
//           <div className="mt-3 flex flex-wrap gap-1 max-h-72 overflow-auto" data-testid="profile-permissions">
//             {user.permissions.length === 0 && (
//               <span className="text-xs text-slate-400">No permissions.</span>
//             )}
//             {user.permissions.map((p) => (
//               <span key={p} className="badge-slate">{p}</span>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
