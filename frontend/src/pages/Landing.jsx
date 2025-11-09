import React, { useState } from "react";
import { useContext } from "react";
import { AuthContext } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Target, Zap, BarChart3, Users, Globe } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Landing = () => {
  const { login } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    company_name: "",
    role: "advertiser"
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await axios.post(`${API}${endpoint}`, payload);
      login(response.data.user, response.data.token);
      toast.success(isLogin ? "Connexion réussie" : "Inscription réussie");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Une erreur s'est produite");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left side - Marketing content */}
          <div className="flex-1 animate-fade-in">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              <span className="gradient-text">AOK</span> - Plateforme RTB Nouvelle Génération
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Optimisez vos campagnes publicitaires avec notre système d'enchères en temps réel.
              Maximisez votre ROI avec des données précises et un ciblage intelligent.
            </p>

            {/* Features grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Enchères en Temps Réel</h3>
                  <p className="text-sm text-gray-600">Système d'enchères ultrarapide pour maximiser vos opportunités</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Target className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Ciblage Avancé</h3>
                  <p className="text-sm text-gray-600">Atteignez votre audience avec précision géographique et démographique</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Analytics Détaillés</h3>
                  <p className="text-sm text-gray-600">Suivez vos performances en temps réel avec des métriques avancées</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Optimisation Continue</h3>
                  <p className="text-sm text-gray-600">Algorithmes intelligents pour améliorer votre ROI automatiquement</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8">
              <div>
                <div className="text-3xl font-bold text-blue-600">10M+</div>
                <div className="text-sm text-gray-600">Impressions/jour</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">500+</div>
                <div className="text-sm text-gray-600">Annonceurs actifs</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-600">98%</div>
                <div className="text-sm text-gray-600">Taux de satisfaction</div>
              </div>
            </div>
          </div>

          {/* Right side - Auth form */}
          <div className="flex-1 max-w-md w-full">
            <Card className="shadow-2xl border-0">
              <CardHeader>
                <CardTitle className="text-2xl" data-testid="auth-title">
                  {isLogin ? "Connexion" : "Créer un compte"}
                </CardTitle>
                <CardDescription>
                  {isLogin
                    ? "Connectez-vous à votre compte AOK"
                    : "Rejoignez notre plateforme AOK aujourd'hui"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      data-testid="email-input"
                      placeholder="vous@exemple.com"
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
                      data-testid="password-input"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>

                  {!isLogin && (
                    <>
                      <div>
                        <Label htmlFor="company">Nom de l'entreprise</Label>
                        <Input
                          id="company"
                          data-testid="company-input"
                          placeholder="Mon Entreprise"
                          value={formData.company_name}
                          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label>Type de compte</Label>
                        <Tabs
                          value={formData.role}
                          onValueChange={(value) => setFormData({ ...formData, role: value })}
                          className="w-full mt-2"
                        >
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="advertiser" data-testid="advertiser-tab">Annonceur</TabsTrigger>
                            <TabsTrigger value="publisher" data-testid="publisher-tab">Éditeur</TabsTrigger>
                          </TabsList>
                        </Tabs>
                      </div>
                    </>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    data-testid="submit-button"
                    disabled={loading}
                  >
                    {loading ? "Chargement..." : isLogin ? "Se connecter" : "S'inscrire"}
                  </Button>

                  <div className="text-center text-sm">
                    <button
                      type="button"
                      onClick={() => setIsLogin(!isLogin)}
                      className="text-blue-600 hover:underline"
                      data-testid="toggle-auth-button"
                    >
                      {isLogin
                        ? "Pas encore de compte ? S'inscrire"
                        : "Déjà un compte ? Se connecter"}
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
