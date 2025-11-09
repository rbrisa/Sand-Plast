import React, { useContext, useState } from "react";
import { AuthContext } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Smartphone, CheckCircle2 } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Security2FA = () => {
  const { user, token } = useContext(AuthContext);
  const [step, setStep] = useState("initial");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEnable2FA = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/security/2fa/enable`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQrCode(response.data.qr_code);
      setSecret(response.data.secret);
      setStep("scan");
      toast.success("QR Code généré !");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/security/2fa/verify?token=${verificationCode}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("🎉 2FA activé avec succès !");
      setStep("enabled");
      window.location.reload();
    } catch (error) {
      toast.error("Code invalide. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir désactiver 2FA ?")) return;
    
    const code = prompt("Entrez votre code 2FA actuel :");
    if (!code) return;

    setLoading(true);
    try {
      await axios.post(`${API}/security/2fa/disable?token=${code}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("2FA désactivé");
      window.location.reload();
    } catch (error) {
      toast.error("Code invalide");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6" data-testid="security-2fa-page">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Authentification à Deux Facteurs</h1>
          <p className="text-gray-600 mt-1">Protégez votre compte avec 2FA</p>
        </div>

        {user?.two_fa_enabled ? (
          /* 2FA Already Enabled */
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-full">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <CardTitle>2FA Activé</CardTitle>
                  <CardDescription>Votre compte est protégé</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                L'authentification à deux facteurs est actuellement activée sur votre compte.
              </p>
              <Button
                variant="destructive"
                onClick={handleDisable2FA}
                disabled={loading}
                data-testid="disable-2fa-button"
              >
                Désactiver 2FA
              </Button>
            </CardContent>
          </Card>
        ) : step === "initial" ? (
          /* Initial State */
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Sécurisez votre compte</CardTitle>
                  <CardDescription>Ajoutez une couche de sécurité supplémentaire</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Pourquoi activer 2FA ?</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Protection contre les accès non autorisés
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Sécurité renforcée pour vos transactions
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                    Conformité avec les meilleures pratiques de sécurité
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">📱 Vous aurez besoin :</h3>
                <p className="text-sm text-gray-700">
                  Une application d'authentification comme <strong>Google Authenticator</strong>,
                  <strong> Authy</strong>, ou <strong>Microsoft Authenticator</strong>.
                </p>
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={handleEnable2FA}
                disabled={loading}
                data-testid="start-2fa-setup"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Activer 2FA
              </Button>
            </CardContent>
          </Card>
        ) : step === "scan" ? (
          /* QR Code Step */
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Étape 1 : Scannez le QR Code</CardTitle>
              <CardDescription>Utilisez votre application d'authentification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {qrCode && (
                <div className="flex flex-col items-center space-y-4">
                  <img src={qrCode} alt="QR Code 2FA" className="w-64 h-64" />
                  
                  <div className="bg-gray-100 p-4 rounded-lg w-full">
                    <p className="text-xs text-gray-600 mb-2">Ou entrez ce code manuellement :</p>
                    <code className="text-sm font-mono bg-white px-3 py-2 rounded border block text-center">
                      {secret}
                    </code>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Étape 2 : Vérifiez le code</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="code">Entrez le code à 6 chiffres</Label>
                    <Input
                      id="code"
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                      data-testid="2fa-code-input"
                      className="text-center text-2xl tracking-widest"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleVerify2FA}
                    disabled={loading || verificationCode.length !== 6}
                    data-testid="verify-2fa-button"
                  >
                    Vérifier et Activer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Info Card */}
        <Card className="border-0 shadow-md bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Important</h3>
                <p className="text-sm text-gray-700">
                  Sauvegardez vos codes de récupération dans un endroit sûr.
                  Si vous perdez accès à votre application d'authentification,
                  vous devrez contacter le support.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Security2FA;
