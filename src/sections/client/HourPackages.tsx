import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore, useInvoiceStore } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Package,
  Calendar,
  DollarSign,
  ShoppingCart,
} from 'lucide-react';

// Hour Package Card
function PackageCard({ 
  pkg, 
  onPurchase 
}: { 
  pkg: { hours: number; pricePerHour: number; name: string; description: string; popular?: boolean };
  onPurchase: () => void;
}) {
  const totalPrice = pkg.hours * pkg.pricePerHour;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-6 rounded-xl border ${pkg.popular ? 'border-primary shadow-lg' : ''}`}
    >
      {pkg.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary">Most Popular</Badge>
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold">{pkg.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">{pkg.description}</p>
      </div>
      
      <div className="text-center mb-6">
        <span className="text-4xl font-bold">R${pkg.pricePerHour}</span>
        <span className="text-muted-foreground">/hour</span>
      </div>
      
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
          <span className="text-sm">Hours Included</span>
          <span className="font-bold">{pkg.hours}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
          <span className="text-sm">Total Price</span>
          <span className="font-bold">R${totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
          <span className="text-sm">Validity</span>
          <span className="font-bold">6 months</span>
        </div>
      </div>
      
      <Button className="w-full" onClick={onPurchase}>
        <ShoppingCart className="w-4 h-4 mr-2" />
        Purchase
      </Button>
    </motion.div>
  );
}

export function HourPackages() {
  const { currentUser } = useAuthStore();
  const { hourPackages, purchaseHours } = useInvoiceStore();
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  // Get client's packages
  const clientPackages = hourPackages.filter(pkg => pkg.clientId === currentUser?.id);
  
  const totalHoursPurchased = clientPackages.reduce((sum, pkg) => sum + pkg.hours, 0);
  const totalHoursUsed = clientPackages.reduce((sum, pkg) => sum + pkg.hoursUsed, 0);
  const totalHoursRemaining = totalHoursPurchased - totalHoursUsed;

  // Available packages to purchase
  const availablePackages = [
    { hours: 50, pricePerHour: 80, name: 'Starter', description: 'Perfect for small projects' },
    { hours: 100, pricePerHour: 70, name: 'Professional', description: 'Best value for regular work', popular: true },
    { hours: 200, pricePerHour: 65, name: 'Enterprise', description: 'For large-scale projects' },
    { hours: 500, pricePerHour: 55, name: 'Enterprise Plus', description: 'Maximum savings' },
  ];

  const handlePurchase = async () => {
    if (selectedPackage) {
      await purchaseHours(currentUser?.id || '', selectedPackage.hours, selectedPackage.pricePerHour);
      toast.success(`Purchased ${selectedPackage.hours} hours successfully!`);
      setIsPurchaseDialogOpen(false);
      setSelectedPackage(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">Hour Packages</h1>
        <p className="text-muted-foreground mt-1">
          Purchase and manage your hour allocations.
        </p>
      </motion.div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Purchased</p>
                <p className="text-3xl font-bold">{totalHoursPurchased}</p>
                <p className="text-xs text-muted-foreground">hours</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hours Used</p>
                <p className="text-3xl font-bold">{totalHoursUsed}</p>
                <p className="text-xs text-muted-foreground">hours</p>
              </div>
              <div className="p-3 rounded-xl bg-orange-500">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-3xl font-bold text-green-600">{totalHoursRemaining}</p>
                <p className="text-xs text-muted-foreground">hours</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Hours Usage</CardTitle>
          <CardDescription>Your current hour allocation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress 
              value={totalHoursPurchased > 0 ? (totalHoursUsed / totalHoursPurchased) * 100 : 0} 
              className="h-4"
            />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {Math.round(totalHoursPurchased > 0 ? (totalHoursUsed / totalHoursPurchased) * 100 : 0)}% used
              </span>
              <span className="font-medium">{totalHoursRemaining} hours remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Packages */}
      {clientPackages.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Active Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clientPackages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant={pkg.status === 'active' ? 'default' : 'secondary'}>
                        {pkg.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Purchased {new Date(pkg.purchasedAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Hours</span>
                        <span className="font-bold">{pkg.hours}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Used</span>
                        <span className="font-bold">{pkg.hoursUsed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Remaining</span>
                        <span className="font-bold text-green-600">{pkg.hoursRemaining}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Price/Hour</span>
                        <span className="font-bold">R${pkg.pricePerHour}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <Progress 
                        value={(pkg.hoursUsed / pkg.hours) * 100} 
                        className="h-2"
                      />
                    </div>
                    
                    {pkg.expiresAt && (
                      <p className="text-xs text-muted-foreground mt-3">
                        Expires: {new Date(pkg.expiresAt).toLocaleDateString()}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Purchase New Package */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Purchase Hours</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {availablePackages.map((pkg, index) => (
            <PackageCard
              key={pkg.name}
              pkg={pkg}
              onPurchase={() => {
                setSelectedPackage(pkg);
                setIsPurchaseDialogOpen(true);
              }}
            />
          ))}
        </div>
      </div>

      {/* Purchase Dialog */}
      <Dialog open={isPurchaseDialogOpen} onOpenChange={setIsPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
            <DialogDescription>
              You are about to purchase {selectedPackage?.hours} hours at ${selectedPackage?.pricePerHour}/hour.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 rounded-lg bg-muted">
            <div className="flex items-center justify-between mb-2">
              <span>Hours</span>
              <span className="font-bold">{selectedPackage?.hours}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span>Price per hour</span>
              <span className="font-bold">R${selectedPackage?.pricePerHour}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold">Total</span>
                <span className="font-bold text-xl">
                  R${selectedPackage ? (selectedPackage.hours * selectedPackage.pricePerHour).toLocaleString() : 0}
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPurchaseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePurchase}>
              <DollarSign className="w-4 h-4 mr-2" />
              Complete Purchase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
