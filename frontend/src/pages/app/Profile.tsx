import { motion } from 'motion/react';
import { User, Mail, GraduationCap, BookOpen, Calendar, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';

export default function Profile() {
  const { profile, signOut } = useAuth();

  if (!profile) return null;

  const isStudent = profile.role === 'student';

  const fields = [
    { icon: Mail, label: 'Email', value: profile.email },
    { icon: User, label: 'Role', value: profile.role.charAt(0).toUpperCase() + profile.role.slice(1) },
    ...(isStudent ? [
      { icon: GraduationCap, label: 'Registration No.', value: profile.registration_number || '—' },
      { icon: BookOpen, label: 'Branch', value: profile.branch || '—' },
      { icon: Calendar, label: 'Batch', value: profile.batch_year || '—' },
    ] : []),
  ];

  return (
    <div className="py-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <span className="text-3xl">
            {isStudent ? '🎓' : '👨‍🏫'}
          </span>
        </div>
        <h2 className="text-xl font-bold text-text-primary">
          {profile.full_name || profile.email.split('@')[0]}
        </h2>
        <p className="text-sm text-text-muted">VIT Bhopal</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-4 shadow-card border border-border-light mb-6"
      >
        <div className="space-y-4">
          {fields.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-text-muted">{label}</p>
                <p className="text-sm font-medium text-text-primary">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      <Button variant="outline" className="w-full" onClick={signOut}>
        <LogOut size={18} /> Sign Out
      </Button>
    </div>
  );
}
