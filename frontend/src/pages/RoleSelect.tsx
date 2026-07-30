import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Monitor, ChefHat } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function RoleSelect() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  if (!profile || !profile.vendor_id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center">
          <p className="text-text-secondary">No vendor access. Please contact admin.</p>
          <button
            onClick={() => navigate('/auth')}
            className="mt-4 text-primary font-semibold cursor-pointer"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  const roles = [
    {
      key: 'counter',
      icon: Monitor,
      title: 'Counter View',
      desc: 'Manage incoming orders, update statuses, and interact with customers.',
      color: '#F5A623',
      path: `/cafe/${profile.vendor_id}/counter`,
    },
    {
      key: 'kitchen',
      icon: ChefHat,
      title: 'Kitchen Display',
      desc: 'View orders to prepare, mark items as done.',
      color: '#E87040',
      path: `/cafe/${profile.vendor_id}/kitchen`,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <span className="text-4xl">🍽️</span>
          <h1 className="text-2xl font-bold font-display text-text-primary mt-2">
            VITe<span className="text-primary">Bites</span>
          </h1>
          <p className="text-sm text-text-secondary mt-1">Choose your view</p>
        </motion.div>

        <div className="space-y-4">
          {roles.map((role, i) => (
            <motion.button
              key={role.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15 }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(role.path)}
              className="w-full glass rounded-2xl p-6 flex items-center gap-4 text-left shadow-card hover:shadow-card-hover transition-shadow cursor-pointer"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: role.color + '15' }}
              >
                <role.icon size={28} style={{ color: role.color }} />
              </div>
              <div>
                <h2 className="font-bold text-text-primary text-lg">{role.title}</h2>
                <p className="text-sm text-text-secondary">{role.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
