import React, { useState, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

// Pages
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Campaigns from "@/pages/Campaigns";
import CampaignDetail from "@/pages/CampaignDetail";
import AdCreatives from "@/pages/AdCreatives";
import Inventory from "@/pages/Inventory";
import Analytics from "@/pages/Analytics";
import AdminPanel from "@/pages/AdminPanel";
import Payment from "@/pages/Payment";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";
import Withdrawals from "@/pages/Withdrawals";
import PlatformRevenue from "@/pages/PlatformRevenue";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth context
export const AuthContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const response = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setUser(response.data);
          setToken(storedToken);
        } catch (error) {
          localStorage.removeItem("token");
          setToken(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem("token", userToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    toast.success("Déconnecté avec succès");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Landing />} />
            <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/" />} />
            <Route path="/campaigns" element={token ? <Campaigns /> : <Navigate to="/" />} />
            <Route path="/campaigns/:id" element={token ? <CampaignDetail /> : <Navigate to="/" />} />
            <Route path="/creatives" element={token ? <AdCreatives /> : <Navigate to="/" />} />
            <Route path="/inventory" element={token ? <Inventory /> : <Navigate to="/" />} />
            <Route path="/analytics" element={token ? <Analytics /> : <Navigate to="/" />} />
            <Route path="/admin" element={token ? <AdminPanel /> : <Navigate to="/" />} />
            <Route path="/payment" element={token ? <Payment /> : <Navigate to="/" />} />
            <Route path="/payment/success" element={token ? <PaymentSuccess /> : <Navigate to="/" />} />
            <Route path="/payment/cancel" element={token ? <PaymentCancel /> : <Navigate to="/" />} />
            <Route path="/withdrawals" element={token ? <Withdrawals /> : <Navigate to="/" />} />
            <Route path="/platform-revenue" element={token ? <PlatformRevenue /> : <Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </div>
    </AuthContext.Provider>
  );
}

export default App;
