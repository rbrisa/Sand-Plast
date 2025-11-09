import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Shield, Search, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuditLogs = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "",
    resource_type: ""
  });

  useEffect(() => {
    if (user?.role !== "super_admin" && user?.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchLogs();
  }, [user]);

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.action) params.append("action", filters.action);
      if (filters.resource_type) params.append("resource_type", filters.resource_type);
      
      const response = await axios.get(`${API}/admin/audit-logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(response.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des logs");
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action) => {
    const colors = {
      LOGIN_SUCCESS: "bg-green-100 text-green-700",
      LOGIN_FAILED: "bg-red-100 text-red-700",
      USER_REGISTERED: "bg-blue-100 text-blue-700",
      PAYMENT_COMPLETED: "bg-purple-100 text-purple-700",
      WITHDRAWAL_REQUESTED: "bg-yellow-100 text-yellow-700",
      WITHDRAWAL_APPROVED: "bg-green-100 text-green-700",
      "2FA_ENABLED": "bg-blue-100 text-blue-700"
    };
    
    const color = colors[action] || "bg-gray-100 text-gray-700";
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {action}
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
      <div className="space-y-6" data-testid="audit-logs-page">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Logs d'Audit</h1>
            </div>
            <p className="text-gray-600 mt-1">Suivi de toutes les activités de la plateforme</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Action</Label>
                <Select
                  value={filters.action}
                  onValueChange={(value) => setFilters({ ...filters, action: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="LOGIN_SUCCESS">Connexion réussie</SelectItem>
                    <SelectItem value="LOGIN_FAILED">Connexion échouée</SelectItem>
                    <SelectItem value="USER_REGISTERED">Inscription</SelectItem>
                    <SelectItem value="PAYMENT_COMPLETED">Paiement</SelectItem>
                    <SelectItem value="WITHDRAWAL_REQUESTED">Retrait demandé</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Type de ressource</Label>
                <Select
                  value={filters.resource_type}
                  onValueChange={(value) => setFilters({ ...filters, resource_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous</SelectItem>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="campaign">Campagne</SelectItem>
                    <SelectItem value="payment">Paiement</SelectItem>
                    <SelectItem value="withdrawal">Retrait</SelectItem>
                    <SelectItem value="auth">Authentification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={fetchLogs} className="w-full" data-testid="apply-filters">
                  <Search className="w-4 h-4 mr-2" />
                  Rechercher
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Activité Récente ({logs.length} entrées)</CardTitle>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucun log trouvé</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Horodatage</TableHead>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Ressource</TableHead>
                      <TableHead>IP</TableHead>
                      <TableHead>Détails</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow key={log.timestamp + log.user_id} data-testid={`log-${log.user_id}`}>
                        <TableCell className="font-mono text-xs">
                          {new Date(log.timestamp).toLocaleString('fr-FR')}
                        </TableCell>
                        <TableCell className="text-xs">
                          {log.user_id.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {getActionBadge(log.action)}
                        </TableCell>
                        <TableCell className="capitalize">{log.resource_type}</TableCell>
                        <TableCell className="font-mono text-xs">{log.ip_address || 'N/A'}</TableCell>
                        <TableCell className="text-xs">
                          {log.details && Object.keys(log.details).length > 0
                            ? JSON.stringify(log.details).substring(0, 50) + '...'
                            : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AuditLogs;
