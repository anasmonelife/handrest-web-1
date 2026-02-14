import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFeaturedPackages } from '@/hooks/useServices';

interface FeaturedBannersProps {
  onSelectPackage: (packageId: string) => void;
}

export function FeaturedBanners({ onSelectPackage }: FeaturedBannersProps) {
  const { data: featured, isLoading } = useFeaturedPackages();

  if (isLoading || !featured?.length) return null;

  return (
    <div className="space-y-3">
      {featured.map((pkg, index) => (
        <motion.div
          key={pkg.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.15 }}
          className="relative overflow-hidden gradient-brand rounded-2xl p-5 shadow-elevated"
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-white/90 text-xs font-medium">Featured Offer</span>
            </div>

            <h3 className="text-xl font-bold text-white mb-1">{pkg.name}</h3>
            {pkg.description && (
              <p className="text-white/80 text-sm mb-3">{pkg.description}</p>
            )}

            <div className="flex items-center gap-3 mb-4">
              {pkg.discount_amount > 0 ? (
                <>
                  <span className="text-2xl font-bold text-white">
                    ₹{(pkg.price - pkg.discount_amount).toLocaleString()}
                  </span>
                  <span className="text-white/60 line-through text-sm">
                    ₹{pkg.price.toLocaleString()}
                  </span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs text-white font-medium flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    Save ₹{pkg.discount_amount.toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold text-white">
                  ₹{pkg.price.toLocaleString()}
                </span>
              )}
            </div>

            <Button
              onClick={() => onSelectPackage(pkg.id)}
              className="w-full bg-white text-brand-teal font-semibold hover:bg-white/90 rounded-full group"
            >
              Book Now
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
