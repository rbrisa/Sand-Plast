import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/App";
import axios from "axios";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Eye, MousePointer, DollarSign, Target } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Analytics = () => {
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
      <div className="space-y-6" data-testid="analytics-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            {isAdvertiser ? "Performance de vos campagnes" : "Performance de vos inventaires"}
          </p>
        </div>

        {/* Main Stats */}
        {isAdvertiser ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-0 shadow-md" data-testid="campaigns-stat">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Campagnes</CardTitle>
                  <Target className="w-4 h-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{analytics?.total_campaigns || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">Total actives</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md" data-testid="impressions-stat">
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

              <Card className="border-0 shadow-md" data-testid="clicks-stat">
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

              <Card className="border-0 shadow-md" data-testid="spend-stat">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Dépenses</CardTitle>
                  <DollarSign className="w-4 h-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    ${(analytics?.total_spend || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Total</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Chart Placeholder */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Performance au fil du temps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Graphique des performances (disponible prochainement)</p>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle>Taux de Clics (CTR)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-blue-600">{analytics?.ctr || 0}%</div>
                  <p className="text-sm text-gray-600 mt-2">Moyenne de toutes les campagnes</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle>Taux de Conversion (CVR)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-green-600">{analytics?.cvr || 0}%</div>
                  <p className="text-sm text-gray-600 mt-2">Conversions / Clics</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle>Solde Restant</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-bold text-purple-600">${(analytics?.balance || 0).toLocaleString()}</div>
                  <p className="text-sm text-gray-600 mt-2">Budget disponible</p>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-0 shadow-md" data-testid="inventory-stat">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Inventaires</CardTitle>
                  <Target className="w-4 h-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{analytics?.total_inventory || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">Espaces actifs</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md" data-testid="publisher-impressions-stat">
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

              <Card className="border-0 shadow-md" data-testid="revenue-stat">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Revenus</CardTitle>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    ${(analytics?.total_revenue || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">CPM: ${analytics?.avg_cpm || 0}</p>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Chart Placeholder */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Revenus au fil du temps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">Graphique des revenus (disponible prochainement)</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Analytics;
