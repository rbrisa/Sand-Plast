import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "@/App";
import axios from "axios";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentSuccess = () => {
  const { token } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("checking");
  const [attempts, setAttempts] = useState(0);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus();
    } else {
      navigate("/dashboard");
    }
  }, [sessionId]);

  const pollPaymentStatus = async () => {
    const maxAttempts = 5;
    
    if (attempts >= maxAttempts) {
      setStatus("timeout");
      return;
    }

    try {
      const response = await axios.get(`${API}/payments/status/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.payment_status === "paid") {
        setStatus("success");
        toast.success("Paiement réussi ! Votre solde a été mis à jour.");
      } else if (response.data.status === "expired") {
        setStatus("expired");
        toast.error("La session de paiement a expiré.");
      } else {
        // Continue polling
        setAttempts(attempts + 1);
        setTimeout(pollPaymentStatus, 2000);
      }
    } catch (error) {
      setStatus("error");
      toast.error("Erreur lors de la vérification du paiement");
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="payment-success-page">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            {status === "checking" && (
              <>
                <Loader2 className="w-16 h-16 text-blue-600 mx-auto animate-spin" />
                <h2 className="text-2xl font-bold text-gray-900">Vérification du paiement...</h2>
                <p className="text-gray-600">Veuillez patienter pendant que nous confirmons votre paiement</p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" data-testid="payment-success-icon" />
                <h2 className="text-2xl font-bold text-gray-900">Paiement réussi !</h2>
                <p className="text-gray-600">Votre compte a été crédité avec succès. Merci pour votre achat !</p>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 mt-4"
                  onClick={() => navigate("/dashboard")}
                  data-testid="goto-dashboard-button"
                >
                  Retour au tableau de bord
                </Button>
              </>
            )}

            {(status === "expired" || status === "timeout" || status === "error") && (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-3xl">❌</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {status === "timeout" ? "Délai d'attente dépassé" : "Erreur de paiement"}
                </h2>
                <p className="text-gray-600">
                  {status === "timeout"
                    ? "Veuillez vérifier votre email pour confirmation ou contactez le support."
                    : "Une erreur s'est produite. Veuillez réessayer."}
                </p>
                <div className="flex gap-3 justify-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/dashboard")}
                    data-testid="goto-dashboard-error-button"
                  >
                    Tableau de bord
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => navigate("/payment")}
                    data-testid="retry-payment-button"
                  >
                    Réessayer
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PaymentSuccess;
