export default function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${dims[size]} border-3 border-primary/20 border-t-primary rounded-full animate-spin`}
      />
    </div>
  );
}
