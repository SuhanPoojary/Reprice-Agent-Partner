import { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";

type PartnerBalanceRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  credit_balance: string | number;
  verification_status: string | null;
  is_active: boolean;
  created_at?: string;
};

type ProductCostRow = {
  product_key: string;
  credits_per_order: number;
  is_active: boolean;
  updated_at?: string;
};

type CreditTxnRow = {
  id: number;
  partner_id: string;
  txn_type: string;
  delta_credits: string | number;
  balance_after: string | number;
  reference_type?: string | null;
  reference_id?: string | null;
  message?: string | null;
  created_at: string;
};

export default function Credits() {
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<PartnerBalanceRow[]>([]);
  const [productCosts, setProductCosts] = useState<ProductCostRow[]>([]);
  const [transactions, setTransactions] = useState<CreditTxnRow[]>([]);

  const [query, setQuery] = useState("");

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<PartnerBalanceRow | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<string>("");
  const [adjustReason, setAdjustReason] = useState<string>("");

  const [costOpen, setCostOpen] = useState(false);
  const [costForm, setCostForm] = useState({ product_key: "default", credits_per_order: "0", is_active: true });

  const filteredPartners = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter((p) => {
      return (
        String(p.id).toLowerCase().includes(q) ||
        String(p.full_name ?? "").toLowerCase().includes(q) ||
        String(p.email ?? "").toLowerCase().includes(q) ||
        String(p.phone ?? "").toLowerCase().includes(q)
      );
    });
  }, [partners, query]);

  const refresh = async () => {
    setLoading(true);
    try {
      const [p, c, t] = await Promise.all([
        api.get("/admin/credits/partners"),
        api.get("/admin/credits/product-costs"),
        api.get("/admin/credits/transactions?limit=100"),
      ]);
      setPartners(p.data?.partners ?? []);
      setProductCosts(c.data?.product_costs ?? []);
      setTransactions(t.data?.transactions ?? []);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to load credits data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const openAdjust = (p: PartnerBalanceRow) => {
    setSelectedPartner(p);
    setAdjustDelta("");
    setAdjustReason("");
    setAdjustOpen(true);
  };

  const submitAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartner) return;

    const deltaNum = Number(adjustDelta);
    if (!Number.isFinite(deltaNum) || deltaNum === 0) {
      toast.error("Enter a non-zero delta");
      return;
    }

    try {
      await api.post("/admin/credits/adjust", {
        partnerId: selectedPartner.id,
        delta: deltaNum,
        reason: adjustReason || undefined,
      });
      toast.success("Credits adjusted");
      setAdjustOpen(false);
      await refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to adjust credits");
    }
  };

  const submitCost = async (e: React.FormEvent) => {
    e.preventDefault();
    const creditsNum = Number(costForm.credits_per_order);
    if (!costForm.product_key.trim()) {
      toast.error("product_key is required");
      return;
    }
    if (!Number.isFinite(creditsNum) || creditsNum < 0) {
      toast.error("credits_per_order must be >= 0");
      return;
    }

    try {
      await api.post("/admin/credits/product-costs", {
        product_key: costForm.product_key.trim(),
        credits_per_order: creditsNum,
        is_active: costForm.is_active,
      });
      toast.success("Product cost updated");
      setCostOpen(false);
      await refresh();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Failed to update product cost");
    }
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
          <h1 className="text-3xl font-bold">Credits</h1>
          <p className="text-gray-500 mt-1">Manage partner balances and credit costs</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refresh()}>
            Refresh
          </Button>
          <Button onClick={() => setCostOpen(true)}>Set Product Cost</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Partners</CardTitle>
            <CardDescription>Search and adjust credits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search by name/email/phone/id"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-6">
                        No partners
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPartners.slice(0, 50).map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-medium">{p.full_name || "(no name)"}</div>
                          <div className="text-xs text-gray-500">{p.email || p.phone || p.id}</div>
                        </TableCell>
                        <TableCell>{Number(p.credit_balance).toLocaleString()}</TableCell>
                        <TableCell className="text-sm">
                          {p.verification_status || "—"}{p.is_active ? "" : " (inactive)"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => openAdjust(p)}>
                            Adjust
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="text-xs text-gray-500">Showing up to 50 results.</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Costs</CardTitle>
            <CardDescription>Credits charged per order product_key</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productCosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 py-6">
                        No product costs
                      </TableCell>
                    </TableRow>
                  ) : (
                    productCosts.map((c) => (
                      <TableRow key={c.product_key}>
                        <TableCell className="font-mono text-xs">{c.product_key}</TableCell>
                        <TableCell>{Number(c.credits_per_order).toLocaleString()}</TableCell>
                        <TableCell>{c.is_active ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Last 100 ledger entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Delta</TableHead>
                  <TableHead>After</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-6">
                      No transactions
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.id}</TableCell>
                      <TableCell className="text-xs font-mono">{t.partner_id}</TableCell>
                      <TableCell>{t.txn_type}</TableCell>
                      <TableCell>{Number(t.delta_credits).toLocaleString()}</TableCell>
                      <TableCell>{Number(t.balance_after).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{new Date(t.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Credits</DialogTitle>
            <DialogDescription>
              Partner: {selectedPartner?.full_name || selectedPartner?.email || selectedPartner?.id}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submitAdjust} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="delta">Delta (can be negative)</Label>
              <Input
                id="delta"
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(e.target.value)}
                placeholder="e.g. 50 or -10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Why are we adjusting?"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAdjustOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Apply</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={costOpen} onOpenChange={setCostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Product Credit Cost</DialogTitle>
            <DialogDescription>Controls credits charged when partner accepts an order.</DialogDescription>
          </DialogHeader>

          <form onSubmit={submitCost} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product_key">Product Key</Label>
              <Input
                id="product_key"
                value={costForm.product_key}
                onChange={(e) => setCostForm((s) => ({ ...s, product_key: e.target.value }))}
                placeholder="default"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits_per_order">Credits Per Order</Label>
              <Input
                id="credits_per_order"
                value={costForm.credits_per_order}
                onChange={(e) => setCostForm((s) => ({ ...s, credits_per_order: e.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={costForm.is_active}
                onChange={(e) => setCostForm((s) => ({ ...s, is_active: e.target.checked }))}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCostOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
