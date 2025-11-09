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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Users, TrendingUp, DollarSign, Target, Eye, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPanel = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    company_name: ""
  });

  useEffect(() => {
    if (user?.role !== "super_admin" && user?.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get(`${API}/admin/statistics`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setStatistics(statsRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/create`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Administrateur créé avec succès");
      setDialogOpen(false);
      setFormData({ email: "", password: "", company_name: "" });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la création");
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.put(`${API}/admin/users/${userId}/status?is_active=${!currentStatus}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Statut mis à jour");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de la mise à jour");
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
      <div className="space-y-6" data-testid="admin-panel">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-red-600" />
              <h1 className="text-3xl font-bold text-gray-900">Panneau d'Administration</h1>
            </div>
            <p className="text-gray-600 mt-1">Gestion de la plateforme RTB</p>
          </div>
          {user?.role === "super_admin" && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700" data-testid="create-admin-button">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer un Admin
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un nouvel administrateur</DialogTitle>
                  <DialogDescription>Ajouter un administrateur à la plateforme</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAdmin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      data-testid="admin-email-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Mot de passe</Label>
                    <Input
                      id="password"
                      type="password"
                      data-testid="admin-password-input"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_name">Nom</Label>
                    <Input
                      id="company_name"
                      data-testid="admin-company-input"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" data-testid="submit-admin-button">
                    Créer l'administrateur
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-0 shadow-md" data-testid="total-users-stat">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Utilisateurs</CardTitle>
              <Users className="w-4 h-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{statistics?.total_users || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                Annonceurs: {statistics?.total_advertisers || 0} | Éditeurs: {statistics?.total_publishers || 0}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md" data-testid="total-campaigns-stat">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Campagnes</CardTitle>
              <Target className="w-4 h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{statistics?.total_campaigns || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Total des campagnes</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md" data-testid="total-impressions-stat">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Impressions</CardTitle>
              <Eye className="w-4 h-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {(statistics?.total_impressions || 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">Total des impressions</p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Gestion des utilisateurs</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} data-testid={`user-row-${u.id}`}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>{u.company_name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        u.role === "super_admin" ? "bg-red-100 text-red-700" :
                        u.role === "admin" ? "bg-orange-100 text-orange-700" :
                        u.role === "advertiser" ? "bg-blue-100 text-blue-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {u.role}
                      </span>
                    </TableCell>
                    <TableCell>${(u.balance || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        u.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {u.is_active ? "Actif" : "Inactif"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {u.role !== "super_admin" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleUserStatus(u.id, u.is_active)}
                          data-testid={`toggle-user-${u.id}`}
                        >
                          {u.is_active ? "Désactiver" : "Activer"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminPanel;
