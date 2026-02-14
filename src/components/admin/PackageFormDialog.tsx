import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Package, ServiceCategory } from '@/types/database';
import type { PackageFormData } from '@/hooks/usePackageMutations';

interface PackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ServiceCategory[];
  editingPackage: Package | null;
  onSubmit: (data: PackageFormData) => void;
  isLoading: boolean;
}

export function PackageFormDialog({
  open,
  onOpenChange,
  categories,
  editingPackage,
  onSubmit,
  isLoading,
}: PackageFormDialogProps) {
  const [form, setForm] = useState<PackageFormData>({
    category_id: '',
    name: '',
    description: '',
    price: 0,
    duration_hours: 1,
    min_staff: 2,
    max_sqft: null,
    features: [],
    is_active: true,
    display_order: 0,
    is_featured: false,
    discount_amount: 0,
  });
  const [featuresText, setFeaturesText] = useState('');

  useEffect(() => {
    if (editingPackage) {
      setForm({
        category_id: editingPackage.category_id,
        name: editingPackage.name,
        description: editingPackage.description,
        price: editingPackage.price,
        duration_hours: editingPackage.duration_hours,
        min_staff: editingPackage.min_staff,
        max_sqft: editingPackage.max_sqft,
        features: editingPackage.features,
        is_active: editingPackage.is_active,
        display_order: editingPackage.display_order,
        is_featured: editingPackage.is_featured,
        discount_amount: editingPackage.discount_amount,
      });
      setFeaturesText(editingPackage.features.join('\n'));
    } else {
      setForm({
        category_id: categories[0]?.id || '',
        name: '',
        description: '',
        price: 0,
        duration_hours: 1,
        min_staff: 2,
        max_sqft: null,
        features: [],
        is_active: true,
        display_order: 0,
        is_featured: false,
        discount_amount: 0,
      });
      setFeaturesText('');
    }
  }, [editingPackage, open, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const features = featuresText.split('\n').map(f => f.trim()).filter(Boolean);
    onSubmit({ ...form, features });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPackage ? 'Edit Package' : 'Create Package'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Category</Label>
            <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Package Name</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price (₹)</Label>
              <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} required min={0} />
            </div>
            <div>
              <Label>Duration (hours)</Label>
              <Input type="number" value={form.duration_hours} onChange={e => setForm(f => ({ ...f, duration_hours: Number(e.target.value) }))} required min={1} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Min Staff</Label>
              <Input type="number" value={form.min_staff} onChange={e => setForm(f => ({ ...f, min_staff: Number(e.target.value) }))} required min={1} />
            </div>
            <div>
              <Label>Max Sq.Ft (blank = unlimited)</Label>
              <Input
                type="number"
                value={form.max_sqft ?? ''}
                onChange={e => setForm(f => ({ ...f, max_sqft: e.target.value ? Number(e.target.value) : null }))}
              />
            </div>
          </div>

          <div>
            <Label>Display Order</Label>
            <Input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: Number(e.target.value) }))} />
          </div>

          <div>
            <Label>Features (one per line)</Label>
            <Textarea value={featuresText} onChange={e => setFeaturesText(e.target.value)} rows={5} placeholder="Feature 1&#10;Feature 2&#10;Feature 3" />
          </div>

          <div className="flex items-center gap-2">
            <Switch checked={form.is_featured} onCheckedChange={v => setForm(f => ({ ...f, is_featured: v }))} />
            <Label>Featured (show as banner)</Label>
          </div>

          {form.is_featured && (
            <div>
              <Label>Discount Amount (₹)</Label>
              <Input type="number" value={form.discount_amount} onChange={e => setForm(f => ({ ...f, discount_amount: Number(e.target.value) }))} min={0} />
              <p className="text-xs text-muted-foreground mt-1">This package will appear as a promotional banner on the customer home screen</p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
            <Label>Active</Label>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="hero" disabled={isLoading}>
              {isLoading ? 'Saving...' : editingPackage ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
