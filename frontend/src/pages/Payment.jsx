import React, { useContext, useState, useEffect } from "react";
import { AuthContext } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Zap, Star, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Payment = () => {
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [packages, setPackages] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "advertiser") {
      navigate("/dashboard");
      return;
    }
    fetchPackages();
  }, [user]);

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API}/payments/packages`);
      setPackages(response.data.packages);
    } catch (error) {
      toast.error("Erreur lors du chargement des forfaits");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (packageId) => {
    try {
      const originUrl = window.location.origin;
      const response = await axios.post(
        `${API}/payments/checkout`,
        {
          package_id: packageId,
          origin_url: originUrl
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Redirect to Stripe
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors du paiement");
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
      <div className="space-y-8" data-testid="payment-page">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Recharger votre solde</h1>
          <p className="text-lg text-gray-600">Choisissez un forfait et rechargez votre compte instantanément</p>
          <div className="mt-4 inline-block bg-blue-50 px-6 py-3 rounded-lg">
            <p className="text-sm text-gray-600">Solde actuel</p>
            <p className="text-3xl font-bold text-blue-600">${(user?.balance || 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Starter */}
          <Card className="border-2 border-gray-200 hover:border-blue-500 transition shadow-lg" data-testid="package-starter">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Starter</CardTitle>
              <CardDescription>Parfait pour commencer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">${packages.starter?.amount}</div>
                <p className="text-sm text-gray-600 mt-2">Obtenez {packages.starter?.credits} crédits</p>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Accès complet à la plateforme</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Analytics en temps réel</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Support 24/7</span>
                </li>
              </ul>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => handlePayment("starter")}
                data-testid="buy-starter"
              >
                Acheter maintenant
              </Button>
            </CardContent>
          </Card>

          {/* Professional */}
          <Card className="border-2 border-blue-600 hover:border-blue-700 transition shadow-2xl relative" data-testid="package-professional">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                Populaire
              </span>
            </div>
            <CardHeader className="text-center pb-4 pt-8">
              <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl">Professional</CardTitle>
              <CardDescription>Idéal pour la croissance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">${packages.professional?.amount}</div>
                <p className="text-sm text-gray-600 mt-2">Obtenez {packages.professional?.credits} crédits</p>
                <span className="inline-block mt-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                  +10% bonus
                </span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Tout du Starter</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Ciblage avancé</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Rapports personnalisés</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Support prioritaire</span>
                </li>
              </ul>
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => handlePayment("professional")}
                data-testid="buy-professional"
              >
                Acheter maintenant
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise */}
          <Card className="border-2 border-gray-200 hover:border-blue-500 transition shadow-lg" data-testid="package-enterprise">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">Enterprise</CardTitle>
              <CardDescription>Pour les grandes campagnes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900">${packages.enterprise?.amount}</div>
                <p className="text-sm text-gray-600 mt-2">Obtenez {packages.enterprise?.credits} crédits</p>
                <span className="inline-block mt-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                  +20% bonus
                </span>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Tout du Professional</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Account manager dédié</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">API personnalisée</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">Rapports en marque blanche</span>
                </li>
              </ul>
              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => handlePayment("enterprise")}
                data-testid="buy-enterprise"
              >
                Acheter maintenant
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Security Info */}
        <div className="text-center text-sm text-gray-600 max-w-2xl mx-auto">
          <p>🔒 Paiements sécurisés par Stripe</p>
          <p className="mt-2">Nous acceptons toutes les cartes bancaires majeures</p>
        </div>
      </div>
    </Layout>
  );
};

export default Payment;
