import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/App";
import { useParams } from "react-router-dom";
import axios from "axios";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, MousePointer, TrendingUp, DollarSign } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CampaignDetail = () => {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaignAnalytics();
  }, [id]);

  const fetchCampaignAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/campaigns/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      console.error("Error fetching campaign analytics:", error);
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

  const campaign = analytics?.campaign;

  return (
    <Layout>
      <div className="space-y-6" data-testid="campaign-detail-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{campaign?.name}</h1>
          <p className="text-gray-600 mt-1">Statistiques détaillées de la campagne</p>
        </div>

        {/* Campaign Info */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Informations de la campagne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600">Statut</p>
                <p className="font-semibold capitalize mt-1">{campaign?.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Budget total</p>
                <p className="font-semibold mt-1">${campaign?.budget?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Budget journalier</p>
                <p className="font-semibold mt-1">${campaign?.daily_budget?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Période</p>
                <p className="font-semibold mt-1">
                  {new Date(campaign?.start_date).toLocaleDateString()} - {new Date(campaign?.end_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-md" data-testid="impressions-card">
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

          <Card className="border-0 shadow-md" data-testid="clicks-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Clics</CardTitle>
              <MousePointer className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {(analytics?.total_clicks || 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">CTR: {analytics?.ctr || 0}%</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md" data-testid="conversions-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Conversions</CardTitle>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {(analytics?.total_conversions || 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">CVR: {analytics?.cvr || 0}%</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md" data-testid="spend-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Dépenses</CardTitle>
              <DollarSign className="w-4 h-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                ${(analytics?.total_spend || 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">Total dépensé</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CampaignDetail;
