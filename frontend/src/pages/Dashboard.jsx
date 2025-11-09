import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/App";
import axios from "axios";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, MousePointer, Eye, DollarSign, Target, BarChart3 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { user, token } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
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

  const isAdvertiser = user?.role === "advertiser";

  return (
    <Layout>
      <div className="space-y-6" data-testid="dashboard-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenue, {user?.company_name}
          </h1>
          <p className="text-gray-600 mt-1">
            {isAdvertiser ? "Vue d'ensemble de vos campagnes publicitaires" : "Statistiques de vos inventaires publicitaires"}
          </p>
        </div>

        {/* Stats Grid */}
        {isAdvertiser ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-0 shadow-md" data-testid="total-campaigns-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Campagnes Actives</CardTitle>
                <Target className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{analytics?.total_campaigns || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Total de campagnes</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md" data-testid="total-impressions-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Impressions</CardTitle>
                <Eye className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {(analytics?.total_impressions || 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">CTR: {analytics?.ctr || 0}%</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md" data-testid="total-clicks-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Clics</CardTitle>
                <MousePointer className="w-4 h-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {(analytics?.total_clicks || 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">CVR: {analytics?.cvr || 0}%</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md" data-testid="total-spend-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Dépenses</CardTitle>
                <DollarSign className="w-4 h-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  ${(analytics?.total_spend || 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">Solde: ${(analytics?.balance || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-md" data-testid="total-inventory-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Inventaires</CardTitle>
                <BarChart3 className="w-4 h-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{analytics?.total_inventory || 0}</div>
                <p className="text-xs text-gray-500 mt-1">Espaces publicitaires actifs</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md" data-testid="total-impressions-publisher-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Impressions</CardTitle>
                <Eye className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {(analytics?.total_impressions || 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">Total des vues</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md" data-testid="total-revenue-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Revenus</CardTitle>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  ${(analytics?.total_revenue || 0).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500 mt-1">CPM moyen: ${analytics?.avg_cpm || 0}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isAdvertiser ? (
                <>
                  <a
                    href="/campaigns"
                    className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                    data-testid="create-campaign-link"
                  >
                    <Target className="w-8 h-8 text-blue-600 mb-2" />
                    <h3 className="font-semibold text-gray-900">Nouvelle Campagne</h3>
                    <p className="text-sm text-gray-600 mt-1">Créer une nouvelle campagne publicitaire</p>
                  </a>
                  <a
                    href="/creatives"
                    className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition"
                    data-testid="create-creative-link"
                  >
                    <BarChart3 className="w-8 h-8 text-green-600 mb-2" />
                    <h3 className="font-semibold text-gray-900">Gérer Créatifs</h3>
                    <p className="text-sm text-gray-600 mt-1">Ajouter et gérer vos créatifs publicitaires</p>
                  </a>
                  <a
                    href="/analytics"
                    className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition"
                    data-testid="view-analytics-link"
                  >
                    <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
                    <h3 className="font-semibold text-gray-900">Analytics</h3>
                    <p className="text-sm text-gray-600 mt-1">Voir les statistiques détaillées</p>
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="/inventory"
                    className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
                    data-testid="create-inventory-link"
                  >
                    <BarChart3 className="w-8 h-8 text-blue-600 mb-2" />
                    <h3 className="font-semibold text-gray-900">Nouvel Inventaire</h3>
                    <p className="text-sm text-gray-600 mt-1">Ajouter un nouvel espace publicitaire</p>
                  </a>
                  <a
                    href="/analytics"
                    className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition"
                    data-testid="view-publisher-analytics-link"
                  >
                    <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
                    <h3 className="font-semibold text-gray-900">Statistiques</h3>
                    <p className="text-sm text-gray-600 mt-1">Voir vos performances</p>
                  </a>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
