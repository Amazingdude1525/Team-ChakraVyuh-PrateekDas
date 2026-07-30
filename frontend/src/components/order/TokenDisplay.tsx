import { motion } from 'motion/react';

interface TokenDisplayProps {
  tokenNumber: string;
  vendorName: string;
}

export default function TokenDisplay({ tokenNumber, vendorName }: TokenDisplayProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-gradient-to-br from-primary to-primary-dark rounded-2xl p-6 text-center text-white shadow-lg"
    >
      <p className="text-xs font-medium opacity-80 mb-1">Your Token</p>
      <motion.p
        initial={{ y: 10 }}
        animate={{ y: 0 }}
        className="text-4xl font-black tracking-wider mb-2"
      >
        {tokenNumber}
      </motion.p>
      <p className="text-sm opacity-80">{vendorName}</p>
    </motion.div>
  );
}
