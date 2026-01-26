import { useEffect, useState } from "react";
import api from "../lib/api";
import { formatCurrency } from "../lib/utils";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";

interface CreditPlan {
  id: number;
  plan_name: string;
  credit_amount: number;
  price: number;
  bonus_percentage: number;
  description: string;
  is_active: boolean;
  created_at: string;
}

export default function CreditPlans() {
  const [plans, setPlans] = useState<CreditPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<CreditPlan | null>(null);

  const [formData, setFormData] = useState({
    plan_name: "",
    credit_amount: "",
    price: "",
    bonus_percentage: "",
    description: "",
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get("/admin/credit-plans");
      setPlans(response.data);
    } catch (error) {
      console.error("Failed to fetch credit plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/admin/credit-plans", {
        ...formData,
        credit_amount: parseFloat(formData.credit_amount),
        price: parseFloat(formData.price),
        bonus_percentage: parseFloat(formData.bonus_percentage) || 0,
      });
      toast.success("Credit plan created successfully");
      setCreateDialog(false);
      resetForm();
      await fetchPlans();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to create plan");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    try {
      await api.put(`/admin/credit-plans/${selectedPlan.id}`, {
        ...formData,
        credit_amount: parseFloat(formData.credit_amount),
        price: parseFloat(formData.price),
        bonus_percentage: parseFloat(formData.bonus_percentage) || 0,
      });
      toast.success("Credit plan updated successfully");
      setEditDialog(false);
      resetForm();
      setSelectedPlan(null);
      await fetchPlans();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to update plan");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to deactivate this credit plan?"))
      return;

    try {
      await api.delete(`/admin/credit-plans/${id}`);
      toast.success("Credit plan deactivated");
      await fetchPlans();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to delete plan");
    }
  };

  const openEditDialog = (plan: CreditPlan) => {
    setSelectedPlan(plan);
    setFormData({
      plan_name: plan.plan_name,
      credit_amount: plan.credit_amount.toString(),
      price: plan.price.toString(),
      bonus_percentage: plan.bonus_percentage.toString(),
      description: plan.description || "",
    });
    setEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      plan_name: "",
      credit_amount: "",
      price: "",
      bonus_percentage: "",
      description: "",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Credit Plans</h1>
          <p className="text-gray-500 mt-1">
            Manage credit packages for partners
          </p>
        </div>
        <Button onClick={() => setCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Plan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Credit Plans</CardTitle>
          <CardDescription>{plans.length} plan(s) configured</CardDescription>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No credit plans found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Credit Amount</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Bonus %</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      {plan.plan_name}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(plan.credit_amount)}
                    </TableCell>
                    <TableCell>{formatCurrency(plan.price)}</TableCell>
                    <TableCell>{plan.bonus_percentage}%</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {plan.description || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.is_active ? "default" : "secondary"}>
                        {plan.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(plan)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(plan.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Credit Plan</DialogTitle>
            <DialogDescription>
              Create a new credit package for partners to purchase
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan_name">Plan Name *</Label>
              <Input
                id="plan_name"
                required
                value={formData.plan_name}
                onChange={(e) =>
                  setFormData({ ...formData, plan_name: e.target.value })
                }
                placeholder="e.g., Starter Pack"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="credit_amount">Credit Amount *</Label>
                <Input
                  id="credit_amount"
                  type="number"
                  step="0.01"
                  required
                  value={formData.credit_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, credit_amount: e.target.value })
                  }
                  placeholder="10000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder="9000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bonus_percentage">Bonus Percentage</Label>
              <Input
                id="bonus_percentage"
                type="number"
                step="0.01"
                value={formData.bonus_percentage}
                onChange={(e) =>
                  setFormData({ ...formData, bonus_percentage: e.target.value })
                }
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe this plan..."
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCreateDialog(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Create Plan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Credit Plan</DialogTitle>
            <DialogDescription>
              Update the credit plan details
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_plan_name">Plan Name *</Label>
              <Input
                id="edit_plan_name"
                required
                value={formData.plan_name}
                onChange={(e) =>
                  setFormData({ ...formData, plan_name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit_credit_amount">Credit Amount *</Label>
                <Input
                  id="edit_credit_amount"
                  type="number"
                  step="0.01"
                  required
                  value={formData.credit_amount}
                  onChange={(e) =>
                    setFormData({ ...formData, credit_amount: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_price">Price (₹) *</Label>
                <Input
                  id="edit_price"
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_bonus_percentage">Bonus Percentage</Label>
              <Input
                id="edit_bonus_percentage"
                type="number"
                step="0.01"
                value={formData.bonus_percentage}
                onChange={(e) =>
                  setFormData({ ...formData, bonus_percentage: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_description">Description</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialog(false);
                  resetForm();
                  setSelectedPlan(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Update Plan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
