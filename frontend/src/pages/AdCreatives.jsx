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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Image as ImageIcon } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdCreatives = () => {
  const { token } = useContext(AuthContext);
  const [creatives, setCreatives] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    campaign_id: "",
    ad_type: "display",
    creative_url: "",
    title: "",
    description: "",
    cta_text: ""
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [creativesRes, campaignsRes] = await Promise.all([
        axios.get(`${API}/creatives`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/campaigns`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setCreatives(creativesRes.data);
      setCampaigns(campaignsRes.data);
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCreative = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/creatives`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Créatif créé avec succès");
      setDialogOpen(false);
      setFormData({ campaign_id: "", ad_type: "display", creative_url: "", title: "", description: "", cta_text: "" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la création");
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
      <div className="space-y-6" data-testid="creatives-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Créatifs Publicitaires</h1>
            <p className="text-gray-600 mt-1">Gérez vos créatifs pour les campagnes</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="create-creative-button">
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Créatif
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Créer un nouveau créatif</DialogTitle>
                <DialogDescription>Ajoutez un créatif publicitaire à votre campagne</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCreative} className="space-y-4">
                <div>
                  <Label htmlFor="campaign">Campagne</Label>
                  <Select
                    value={formData.campaign_id}
                    onValueChange={(value) => setFormData({ ...formData, campaign_id: value })}
                  >
                    <SelectTrigger data-testid="campaign-select">
                      <SelectValue placeholder="Sélectionnez une campagne" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ad_type">Type de publicité</Label>
                  <Select
                    value={formData.ad_type}
                    onValueChange={(value) => setFormData({ ...formData, ad_type: value })}
                  >
                    <SelectTrigger data-testid="ad-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="display">Display</SelectItem>
                      <SelectItem value="video">Vidéo</SelectItem>
                      <SelectItem value="native">Native</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="creative_url">URL du créatif</Label>
                  <Input
                    id="creative_url"
                    data-testid="creative-url-input"
                    placeholder="https://exemple.com/image.jpg"
                    value={formData.creative_url}
                    onChange={(e) => setFormData({ ...formData, creative_url: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="title">Titre</Label>
                  <Input
                    id="title"
                    data-testid="creative-title-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    data-testid="creative-description-input"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cta_text">Texte du bouton CTA</Label>
                  <Input
                    id="cta_text"
                    data-testid="creative-cta-input"
                    placeholder="En savoir plus"
                    value={formData.cta_text}
                    onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" data-testid="submit-creative-button">
                  Créer le créatif
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Creatives Grid */}
        {creatives.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun créatif</h3>
              <p className="text-gray-600 text-center mb-4">Créez votre premier créatif publicitaire</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creatives.map((creative) => (
              <Card key={creative.id} className="border-0 shadow-md card-hover" data-testid={`creative-card-${creative.id}`}>
                <CardHeader>
                  <div className="aspect-video bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    <img
                      src={creative.creative_url}
                      alt={creative.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                        e.target.parentElement.innerHTML = '<div class="text-gray-400"><svg class="w-12 h-12" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" /></svg></div>';
                      }}
                    />
                  </div>
                  <CardTitle className="text-lg">{creative.title}</CardTitle>
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded mt-2 capitalize">
                    {creative.ad_type}
                  </span>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-gray-600 line-clamp-2">{creative.description}</p>
                  <Button size="sm" variant="outline" className="w-full mt-3">
                    {creative.cta_text}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdCreatives;
