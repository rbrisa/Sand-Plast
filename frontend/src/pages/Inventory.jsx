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
import { Plus, Package } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Inventory = () => {
  const { token } = useContext(AuthContext);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    site_url: "",
    ad_format: "",
    min_cpm: ""
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get(`${API}/inventory`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInventory(response.data);
    } catch (error) {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInventory = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/inventory`, {
        ...formData,
        min_cpm: parseFloat(formData.min_cpm)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Inventaire créé avec succès");
      setDialogOpen(false);
      setFormData({ site_url: "", ad_format: "", min_cpm: "" });
      fetchInventory();
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
      <div className="space-y-6" data-testid="inventory-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventaires</h1>
            <p className="text-gray-600 mt-1">Gérez vos espaces publicitaires</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700" data-testid="create-inventory-button">
                <Plus className="w-4 h-4 mr-2" />
                Nouvel Inventaire
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouvel inventaire</DialogTitle>
                <DialogDescription>Ajoutez un nouvel espace publicitaire</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateInventory} className="space-y-4">
                <div>
                  <Label htmlFor="site_url">URL du site</Label>
                  <Input
                    id="site_url"
                    data-testid="site-url-input"
                    placeholder="https://monsite.com"
                    value={formData.site_url}
                    onChange={(e) => setFormData({ ...formData, site_url: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="ad_format">Format publicitaire</Label>
                  <Input
                    id="ad_format"
                    data-testid="ad-format-input"
                    placeholder="300x250, 728x90, etc."
                    value={formData.ad_format}
                    onChange={(e) => setFormData({ ...formData, ad_format: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="min_cpm">CPM minimum ($)</Label>
                  <Input
                    id="min_cpm"
                    type="number"
                    step="0.01"
                    data-testid="min-cpm-input"
                    placeholder="5.00"
                    value={formData.min_cpm}
                    onChange={(e) => setFormData({ ...formData, min_cpm: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" data-testid="submit-inventory-button">
                  Créer l'inventaire
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Inventory List */}
        {inventory.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun inventaire</h3>
              <p className="text-gray-600 text-center mb-4">Créez votre premier espace publicitaire</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inventory.map((item) => (
              <Card key={item.id} className="border-0 shadow-md card-hover" data-testid={`inventory-card-${item.id}`}>
                <CardHeader>
                  <CardTitle className="text-lg truncate">{item.site_url}</CardTitle>
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs rounded mt-2 font-medium">
                    {item.status}
                  </span>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Format</p>
                    <p className="font-semibold text-gray-900">{item.ad_format}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">CPM minimum</p>
                    <p className="text-xl font-bold text-blue-600">${item.min_cpm}</p>
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

export default Inventory;
