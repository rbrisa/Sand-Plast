import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, ArrowDownToLine, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Withdrawals = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    payment_method: "bank_transfer",
    payment_details: ""
  });

  useEffect(() => {
    if (user?.role !== "publisher") {
      navigate("/dashboard");
      return;
    }
    fetchWithdrawals();
  }, [user]);

  const fetchWithdrawals = async () => {
    try {
      const response = await axios.get(`${API}/withdrawals/my-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWithdrawals(response.data);
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/withdrawals/request`, {
        ...formData,
        amount: parseFloat(formData.amount)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Demande de retrait soumise avec succès");
      setDialogOpen(false);
      setFormData({ amount: "", payment_method: "bank_transfer", payment_details: "" });
      fetchWithdrawals();
      // Refresh user data
      window.location.reload();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la demande");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "En attente", icon: Clock },
      approved: { bg: "bg-green-100", text: "text-green-700", label: "Approuvé", icon: CheckCircle2 },
      rejected: { bg: "bg-red-100", text: "text-red-700", label: "Rejeté", icon: XCircle },
      completed: { bg: "bg-blue-100", text: "text-blue-700", label: "Complété", icon: CheckCircle2 }
    };
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" data-testid="withdrawals-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Retraits</h1>
            <p className="text-gray-600 mt-1">Gérez vos demandes de retrait</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700" data-testid="request-withdrawal-button">
                <ArrowDownToLine className="w-4 h-4 mr-2" />
                Demander un retrait
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Demander un retrait</DialogTitle>
                <DialogDescription>
                  Montant minimum : $50 | Solde disponible : ${(user?.balance || 0).toLocaleString()}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleRequestWithdrawal} className="space-y-4">
                <div>
                  <Label htmlFor="amount">Montant ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="50"
                    max={user?.balance || 0}
                    data-testid="withdrawal-amount-input"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="payment_method">Méthode de paiement</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value) => setFormData({ ...formData, payment_method: value })}
                  >
                    <SelectTrigger data-testid="payment-method-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="crypto">Crypto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="payment_details">Détails de paiement</Label>
                  <Textarea
                    id="payment_details"
                    data-testid="payment-details-input"
                    placeholder="IBAN, email PayPal, wallet address, etc."
                    value={formData.payment_details}
                    onChange={(e) => setFormData({ ...formData, payment_details: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" data-testid="submit-withdrawal-button">
                  Soumettre la demande
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Balance Card */}
        <Card className="border-0 shadow-md bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Solde disponible</p>
                <p className="text-4xl font-bold text-green-600">
                  ${(user?.balance || 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-16 h-16 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        {/* Withdrawals List */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Historique des retraits</CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals.length === 0 ? (
              <div className="text-center py-12">
                <ArrowDownToLine className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun retrait</h3>
                <p className="text-gray-600">Vous n'avez pas encore effectué de demande de retrait</p>
              </div>
            ) : (
              <div className="space-y-4">
                {withdrawals.map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                    data-testid={`withdrawal-${withdrawal.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="text-xl font-bold text-gray-900">
                          ${withdrawal.amount.toLocaleString()}
                        </p>
                        {getStatusBadge(withdrawal.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Via {withdrawal.payment_method} • {new Date(withdrawal.created_at).toLocaleDateString()}
                      </p>
                      {withdrawal.processed_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Traité le {new Date(withdrawal.processed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Withdrawals;
