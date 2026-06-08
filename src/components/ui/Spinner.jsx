import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Spinner({ className, size = 20 }) {
  return <Loader2 className={cn('animate-spin text-primary-500', className)} size={size} />;
}

export function FullScreenSpinner() {
  return (
    <div className="flex h-full min-h-[200px] w-full items-center justify-center py-16">
      <Spinner size={28} />
    </div>
  );
}
