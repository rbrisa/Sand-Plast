import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Play, Pause, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Campaigns = () => {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    budget: "",
    daily_budget: "",
    start_date: "",
    end_date: "",
    targeting: {}
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await axios.get(`${API}/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(response.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des campagnes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/campaigns`, {
        ...formData,
        budget: parseFloat(formData.budget),
        daily_budget: parseFloat(formData.daily_budget)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Campagne créée avec succès");
      setDialogOpen(false);
      setFormData({ name: "", budget: "", daily_budget: "", start_date: "", end_date: "", targeting: {} });
      fetchCampaigns();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la création");
    }
  };

  const handleStatusChange = async (campaignId, newStatus) => {
    try {
      await axios.put(`${API}/campaigns/${campaignId}?status=${newStatus}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Statut mis à jour");
      fetchCampaigns();
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: "badge badge-active",
      paused: "badge badge-paused",
      draft: "badge badge-draft",
      completed: "badge badge-completed"
    };
    return badges[status] || badges.draft;
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
      <div className="space-y-6" data-testid="campaigns-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campagnes</h1>
            <p className="text-gray-600 mt-1">Gérez vos campagnes publicitaires</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="create-campaign-button">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Campagne
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une nouvelle campagne</DialogTitle>
                <DialogDescription>Remplissez les informations de votre campagne</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCampaign} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom de la campagne</Label>
                  <Input
                    id="name"
                    data-testid="campaign-name-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget">Budget total ($)</Label>
                    <Input
                      id="budget"
                      type="number"
                      data-testid="campaign-budget-input"
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="daily_budget">Budget journalier ($)</Label>
                    <Input
                      id="daily_budget"
                      type="number"
                      data-testid="campaign-daily-budget-input"
                      value={formData.daily_budget}
                      onChange={(e) => setFormData({ ...formData, daily_budget: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date">Date de début</Label>
                    <Input
                      id="start_date"
                      type="date"
                      data-testid="campaign-start-date-input"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date">Date de fin</Label>
                    <Input
                      id="end_date"
                      type="date"
                      data-testid="campaign-end-date-input"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" data-testid="submit-campaign-button">
                  Créer la campagne
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Campaigns List */}
        {campaigns.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune campagne</h3>
              <p className="text-gray-600 text-center mb-4">Créez votre première campagne pour commencer</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="border-0 shadow-md card-hover" data-testid={`campaign-card-${campaign.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <span className={`${getStatusBadge(campaign.status)} mt-2`}>
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Budget total</p>
                    <p className="text-xl font-bold text-gray-900">${campaign.budget.toLocaleString()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Budget/jour</p>
                      <p className="font-semibold">${campaign.daily_budget}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Période</p>
                      <p className="font-semibold">
                        {new Date(campaign.start_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-3">
                    {campaign.status === "draft" || campaign.status === "paused" ? (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleStatusChange(campaign.id, "active")}
                        data-testid={`activate-campaign-${campaign.id}`}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Activer
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleStatusChange(campaign.id, "paused")}
                        data-testid={`pause-campaign-${campaign.id}`}
                      >
                        <Pause className="w-4 h-4 mr-1" />
                        Pause
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                      data-testid={`view-campaign-${campaign.id}`}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

import { Target } from "lucide-react";
export default Campaigns;
