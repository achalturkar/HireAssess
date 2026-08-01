// 'use client';

// import { useForm } from 'react-hook-form';
// import { useRouter } from 'next/navigation';
// import toast from 'react-hot-toast';
// import { api, pickError } from '@/src/lib/api';
// import { useAuthStore } from '@/src/lib/auth';
// import PageHeader from '@/components/PageHeader';

// interface Form {
//   currentPassword: string;
//   newPassword: string;
//   confirmPassword: string;
// }

// // Same rule as backend
// const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-\[\]\\/]).{8,128}$/;

// export default function ChangePasswordPage() {
//   const router = useRouter();
//   const { user, logout } = useAuthStore();
//   const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Form>();

//   const onSubmit = async (values: Form) => {
//     if (values.newPassword !== values.confirmPassword) {
//       toast.error('New password and confirmation do not match.');
//       return;
//     }
//     try {
//       await api.post('/auth/change-password', {
//         currentPassword: values.currentPassword,
//         newPassword: values.newPassword,
//       });
//       toast.success('Password changed. Please sign in again.');
//       await logout();
//       router.replace('/login');
//     } catch (err) {
//       toast.error(pickError(err));
//     }
//   };

//   const newPwd = watch('newPassword') || '';

//   return (
//     <div>
//       <PageHeader
//         title="Change Password"
//         subtitle="You will be signed out and asked to sign in with your new password."
//         crumbs={[{ href: '/dashboard', label: 'Overview' }, { label: 'Change Password' }]}
//       />

//       {user?.mustChangePassword && (
//         <div className="mb-6 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" data-testid="must-change-banner">
//           You&apos;re using a temporary password. Set a new one before continuing.
//         </div>
//       )}

//       <div className="max-w-md">
//         <form onSubmit={handleSubmit(onSubmit)} className="card p-6" data-testid="change-password-form">
//           <div>
//             <label className="label">Current password</label>
//             <input
//               type="password"
//               className="input"
//               data-testid="cp-current"
//               autoComplete="current-password"
//               {...register('currentPassword', { required: 'Required' })}
//             />
//             {errors.currentPassword && <p className="mt-1 text-xs text-red-600">{errors.currentPassword.message}</p>}
//           </div>

//           <div className="mt-4">
//             <label className="label">New password</label>
//             <input
//               type="password"
//               className="input"
//               data-testid="cp-new"
//               autoComplete="new-password"
//               {...register('newPassword', {
//                 required: 'Required',
//                 pattern: {
//                   value: PASSWORD_RULE,
//                   message: 'Min 8 chars with upper, lower, digit and special character',
//                 },
//               })}
//             />
//             {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword.message}</p>}
//             <PasswordStrengthMeter password={newPwd} />
//           </div>

//           <div className="mt-4">
//             <label className="label">Confirm new password</label>
//             <input
//               type="password"
//               className="input"
//               data-testid="cp-confirm"
//               autoComplete="new-password"
//               {...register('confirmPassword', { required: 'Required' })}
//             />
//             {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>}
//           </div>

//           <button
//             type="submit"
//             className="btn-primary mt-6 w-full"
//             disabled={isSubmitting}
//             data-testid="cp-submit"
//           >
//             {isSubmitting ? 'Updating...' : 'Change password'}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// function PasswordStrengthMeter({ password }: { password: string }) {
//   const checks = [
//     { label: '8+ chars', ok: password.length >= 8 },
//     { label: 'Lowercase', ok: /[a-z]/.test(password) },
//     { label: 'Uppercase', ok: /[A-Z]/.test(password) },
//     { label: 'Digit', ok: /\d/.test(password) },
//     { label: 'Special', ok: /[!@#$%^&*(),.?":{}|<>_\-\[\]\\/]/.test(password) },
//   ];
//   return (
//     <div className="mt-2 flex flex-wrap gap-1 text-xs" data-testid="password-strength">
//       {checks.map((c) => (
//         <span
//           key={c.label}
//           className={c.ok ? 'badge-green' : 'badge-slate'}
//         >
//           {c.ok ? '✓' : '·'} {c.label}
//         </span>
//       ))}
//     </div>
//   );
// }
