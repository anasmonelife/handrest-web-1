import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useServiceCategories, usePackages } from '@/hooks/useServices';
import { useCreatePackage, useUpdatePackage, useDeletePackage } from '@/hooks/usePackageMutations';
import { PackageFormDialog } from './PackageFormDialog';
import { useToast } from '@/hooks/use-toast';
import type { Package } from '@/types/database';
import type { PackageFormData } from '@/hooks/usePackageMutations';

export function PackagesTab() {
  const { data: categories } = useServiceCategories();
  const { data: packages } = usePackages();
  const createPkg = useCreatePackage();
  const updatePkg = useUpdatePackage();
  const deletePkg = useDeletePackage();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Package | null>(null);

  const handleCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (pkg: Package) => {
    setEditing(pkg);
    setDialogOpen(true);
  };

  const handleSubmit = async (data: PackageFormData) => {
    try {
      if (editing) {
        await updatePkg.mutateAsync({ id: editing.id, ...data });
        toast({ title: 'Package updated' });
      } else {
        await createPkg.mutateAsync(data);
        toast({ title: 'Package created' });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: 'Error saving package', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePkg.mutateAsync(deleteTarget.id);
      toast({ title: 'Package deleted' });
      setDeleteTarget(null);
    } catch {
      toast({ title: 'Failed to delete package', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Packages & Pricing</h1>
        <Button variant="hero" onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Package
        </Button>
      </div>

      {categories?.map(category => (
        <Card key={category.id}>
          <CardHeader>
            <CardTitle>{category.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Staff</TableHead>
                  <TableHead>Max Area</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages?.filter(p => p.category_id === category.id).map(pkg => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">
                      {pkg.name}
                      {pkg.is_featured && (
                        <Badge className="ml-2 bg-amber-100 text-amber-800 text-xs">Banner</Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{pkg.description}</TableCell>
                    <TableCell>{pkg.duration_hours}h</TableCell>
                    <TableCell>{pkg.min_staff}</TableCell>
                    <TableCell>{pkg.max_sqft ? `${pkg.max_sqft} sq.ft` : 'Unlimited'}</TableCell>
                    <TableCell className="font-semibold">
                      ₹{pkg.price.toLocaleString()}
                      {pkg.discount_amount > 0 && (
                        <span className="text-xs text-green-600 ml-1">(-₹{pkg.discount_amount})</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={pkg.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {pkg.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(pkg)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(pkg)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      <PackageFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        categories={categories || []}
        editingPackage={editing}
        onSubmit={handleSubmit}
        isLoading={createPkg.isPending || updatePkg.isPending}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Existing bookings using this package won't be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
