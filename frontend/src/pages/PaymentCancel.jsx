import React from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]" data-testid="payment-cancel-page">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="pt-12 pb-12 text-center space-y-6">
            <XCircle className="w-16 h-16 text-orange-600 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">Paiement annulé</h2>
            <p className="text-gray-600">
              Vous avez annulé le paiement. Aucun montant n'a été débité.
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                data-testid="goto-dashboard-button"
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PaymentCancel;
