import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, Percent, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PlatformRevenue = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [revenueData, setRevenueData] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "super_admin") {
      navigate("/dashboard");
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [revenueRes, withdrawalsRes] = await Promise.all([
        axios.get(`${API}/admin/platform-revenue`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/admin/withdrawals`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setRevenueData(revenueRes.data);
      setWithdrawals(withdrawalsRes.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveWithdrawal = async (withdrawalId) => {
    try {
      await axios.put(`${API}/admin/withdrawals/${withdrawalId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Retrait approuvé");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
  };

  const handleRejectWithdrawal = async (withdrawalId) => {
    try {
      await axios.put(`${API}/admin/withdrawals/${withdrawalId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Retrait rejeté et montant remboursé");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    }
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
      <div className="space-y-6" data-testid="platform-revenue-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenus de la Plateforme</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble des revenus AOK</p>
        </div>

        {/* Revenue Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-md" data-testid="total-revenue-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Revenu Total</CardTitle>
              <DollarSign className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                ${(revenueData?.total_platform_revenue || 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">Commissions + Paiements</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md" data-testid="commission-revenue-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Commissions</CardTitle>
              <Percent className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                ${(revenueData?.total_commission || 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {revenueData?.commission_rate}% sur enchères
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md" data-testid="payment-revenue-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Paiements</CardTitle>
              <CreditCard className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                ${(revenueData?.total_payments || 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">Recharges Stripe</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md" data-testid="pending-withdrawals-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Retraits en attente</CardTitle>
              <TrendingUp className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {withdrawals.filter(w => w.status === "pending").length}
              </div>
              <p className="text-xs text-gray-500 mt-1">À traiter</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Commissions */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Commissions Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData?.recent_commissions?.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucune commission encore</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueData?.recent_commissions?.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>
                        {new Date(commission.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{commission.description}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        ${commission.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pending Withdrawals */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Demandes de Retrait en Attente</CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals.filter(w => w.status === "pending").length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucune demande en attente</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Éditeur</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Méthode</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.filter(w => w.status === "pending").map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{withdrawal.user?.company_name}</p>
                          <p className="text-xs text-gray-500">{withdrawal.user?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${withdrawal.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="capitalize">{withdrawal.payment_method}</TableCell>
                      <TableCell>
                        {new Date(withdrawal.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveWithdrawal(withdrawal.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                            data-testid={`approve-withdrawal-${withdrawal.id}`}
                          >
                            Approuver
                          </button>
                          <button
                            onClick={() => handleRejectWithdrawal(withdrawal.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                            data-testid={`reject-withdrawal-${withdrawal.id}`}
                          >
                            Rejeter
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PlatformRevenue;
