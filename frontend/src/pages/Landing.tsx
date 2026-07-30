import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, MapPin, Zap, Shield, Star } from 'lucide-react';
import Button from '../components/ui/Button';

const vendors = [
  { name: 'Mayuri (AB)', location: 'Academic Block', emoji: '🍛', color: '#F5A623' },
  { name: 'Mayuri (SB)', location: 'Special Block', emoji: '🍜', color: '#E8913A' },
  { name: 'UnderBelly (UB)', location: 'Near AB1', emoji: '🍔', color: '#E87040' },
  { name: 'Dakshin', location: 'Special Block', emoji: '🥘', color: '#D4891A' },
  { name: 'Bistro by Safal', location: 'Special Block', emoji: '☕', color: '#C47A1A' },
];

const features = [
  { icon: Clock, title: 'Skip the Queue', desc: 'Pre-order from class. Walk in, grab, leave.' },
  { icon: Zap, title: 'Real-time Tracking', desc: 'Know exactly when your food is ready.' },
  { icon: MapPin, title: '5 Cafes, 1 App', desc: 'Every campus cafe in your pocket.' },
  { icon: Shield, title: 'Secure Payments', desc: 'Razorpay-powered, totally safe.' },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen gradient-hero overflow-hidden">
      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">🍽️</span>
          <span className="text-xl font-bold font-display text-text-primary">
            VITe<span className="text-primary">Bites</span>
          </span>
        </div>
        <Button size="sm" onClick={() => navigate('/auth')}>
          Sign In <ArrowRight size={16} />
        </Button>
      </motion.nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-12 pb-20 md:pt-20 md:pb-28">
        <div className="text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
          >
            <Star size={14} /> VIT Bhopal Exclusive
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl font-black text-text-primary leading-tight mb-4"
          >
            5 cafes. One app.{' '}
            <span className="text-gradient">Zero queues.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-lg text-text-secondary mb-8 max-w-lg mx-auto"
          >
            Pre-order from any campus cafe, pay online, and walk straight to the counter.
            No more waiting in lines between classes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button size="lg" onClick={() => navigate('/auth')}>
              Get Started <ArrowRight size={20} />
            </Button>
            <Button size="lg" variant="outline" onClick={() => {
              document.getElementById('vendors')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Explore Cafes
            </Button>
          </motion.div>
        </div>

        {/* Floating food emojis */}
        <div className="relative mt-12 flex justify-center">
          {['🍕', '🍔', '🥘', '☕', '🍛', '🧋', '🍟'].map((emoji, i) => (
            <motion.span
              key={i}
              className="absolute text-3xl md:text-4xl"
              initial={{ opacity: 0, y: 40 }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: [-20, -60 - i * 15],
                x: (i - 3) * 60,
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatDelay: 2,
                delay: i * 0.4,
              }}
            >
              {emoji}
            </motion.span>
          ))}
        </div>
      </section>

      {/* Vendor cards */}
      <section id="vendors" className="py-16 px-6 bg-white/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
              Campus Cafes
            </h2>
            <p className="text-text-secondary">All your favorite spots, one tap away</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {vendors.map((vendor, i) => (
              <motion.div
                key={vendor.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -6, scale: 1.03 }}
                className="glass rounded-2xl p-5 text-center cursor-pointer shadow-card hover:shadow-card-hover transition-shadow"
                onClick={() => navigate('/auth')}
              >
                <div
                  className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl"
                  style={{ backgroundColor: vendor.color + '15' }}
                >
                  {vendor.emoji}
                </div>
                <h3 className="font-bold text-sm text-text-primary mb-0.5">{vendor.name}</h3>
                <p className="text-[11px] text-text-muted flex items-center justify-center gap-1">
                  <MapPin size={10} /> {vendor.location}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">
              Why VITeBites?
            </h2>
            <p className="text-text-secondary">Built by students, for students</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 flex gap-4 items-start"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary mb-1">{feature.title}</h3>
                  <p className="text-sm text-text-secondary">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border-light">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-text-muted">
            Made with ❤️ at VIT Bhopal • Summer of CodeFest 2.0
          </p>
        </div>
      </footer>
    </div>
  );
}
