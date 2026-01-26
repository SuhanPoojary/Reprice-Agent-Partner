import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import api from "../lib/api";
import { formatDateTime } from "../lib/utils";
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
import { Badge } from "../components/ui/badge";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";

interface Partner {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  company_name: string;
  verification_status: string;
  credit_balance: number;
  is_active: boolean;
  created_at: string;
}

export default function PendingPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingPartners();
  }, []);

  const fetchPendingPartners = async () => {
    try {
      const response = await api.get("/admin/partners/pending-verification");
      setPartners(response.data);
    } catch (error) {
      console.error("Failed to fetch partners:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800" },
      under_review: { icon: AlertCircle, color: "bg-blue-100 text-blue-800" },
      clarification_needed: {
        icon: AlertCircle,
        color: "bg-orange-100 text-orange-800",
      },
      approved: { icon: CheckCircle, color: "bg-green-100 text-green-800" },
      rejected: { icon: XCircle, color: "bg-red-100 text-red-800" },
      suspended: { icon: XCircle, color: "bg-gray-100 text-gray-800" },
    };

    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;

    return (
      <Badge
        className={`${variant.color} flex items-center gap-1`}
        variant="outline"
      >
        <Icon className="h-3 w-3" />
        {status.replace(/_/g, " ").toUpperCase()}
      </Badge>
    );
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
          <h1 className="text-3xl font-bold">Pending Verifications</h1>
          <p className="text-gray-500 mt-1">
            Review and approve partner applications
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate("/partners")}>
          View All Partners
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Partner Applications</CardTitle>
          <CardDescription>
            {partners.length} partner(s) awaiting verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          {partners.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No pending verifications
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied On</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium">
                      {partner.full_name}
                    </TableCell>
                    <TableCell>{partner.company_name || "-"}</TableCell>
                    <TableCell>{partner.email}</TableCell>
                    <TableCell>{partner.phone}</TableCell>
                    <TableCell>
                      {getStatusBadge(partner.verification_status)}
                    </TableCell>
                    <TableCell>{formatDateTime(partner.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/partners/${partner.id}`)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
