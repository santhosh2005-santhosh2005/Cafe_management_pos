import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type React from "react";
import { login } from "@/store/userSlice";
import type { AppDispatch } from "@/store";
import axios from "axios";
import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError("");

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const res = await axios.post(`${apiUrl}/api/users/login`, {
        email,
        password,
      });

      dispatch(
        login({
          id: res.data.user._id,
          name: res.data.user.name,
          email: res.data.user.email,
          role: res.data.user.role,
          token: res.data.token,
        })
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (res.data.user.role === "admin") {
        navigate("/dashboard");
      } else if (res.data.user.role === "customer") {
        navigate("/self-order"); // Guest entry redirect
      } else {
        navigate("/dashboard/pos");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      setError("");

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001";
      const res = await axios.post(`${apiUrl}/api/users/google-login`, {
        token: credentialResponse.credential,
      });

      dispatch(
        login({
          id: res.data.user._id,
          name: res.data.user.name,
          email: res.data.user.email,
          role: res.data.user.role,
          token: res.data.token,
        })
      );

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (res.data.user.role === "admin") {
        navigate("/dashboard");
      } else if (res.data.user.role === "customer") {
        navigate("/customer-display"); // General customer route
      } else {
        navigate("/dashboard/pos");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Google Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleLogin();
  };

  return (
    <div className="min-h-screen bg-warm-white flex flex-col md:flex-row">
      {/* 🌑 20% Soft Black Side Panel */}
      <div className="w-full md:w-1/3 bg-deep-black text-warm-white p-12 md:p-20 flex flex-col justify-between border-b-8 md:border-b-0 md:border-r-8 border-golden-yellow">
        <div>
          <div className="w-24 h-24 bg-white p-2 mb-12">
            <img src="/logo.png" alt="Odoo POS Cafe" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-6xl md:text-8xl leading-[0.85] italic tracking-tighter mb-8">
            RESTAURANT<br />
            <span className="text-golden-yellow">TECH</span><br />
            NIQUE.
          </h1>
          <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase max-w-xs">
            [ACCESS_PROTOCOL_INITIATED]<br />
            Version: 2.0.4 - Brutalist Edition<br />
            Encrypted Session Management
          </p>
        </div>

        <div className="hidden md:block">
          <div className="-rotate-90 origin-left inline-block">
            <p className="font-black text-4xl text-golden-yellow opacity-10">ODOO POS CAFE</p>
          </div>
        </div>
      </div>

      {/* ⚪️ Main Login Area */}
      <div className="flex-1 p-8 md:p-20 flex items-center justify-center">
        <div className="w-full max-w-lg space-y-12">
          <div className="space-y-2">
            <span className="bg-golden-yellow text-deep-black px-2 py-1 font-mono font-black text-xs">SYSTEM_LOGIN</span>
            <h2 className="text-5xl font-black italic tracking-tight">IDENTITY VERIFICATION</h2>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-deep-black text-white p-4 font-mono text-xs border-l-4 border-red-600 flex items-center gap-3">
                <span className="text-red-500 font-black">[!] ERROR</span>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label className="font-mono uppercase text-[10px] tracking-widest text-deep-black/60 ml-1">E-Mail Endpoint</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-16 bg-white border-2 border-deep-black font-bold focus:shadow-[4px_4px_0_0_#F5B400] transition-all"
                placeholder="OPERATOR@SYSTEM.COM"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="font-mono uppercase text-[10px] tracking-widest text-deep-black/60 ml-1">Security Cipher</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-16 bg-white border-2 border-deep-black font-bold focus:shadow-[4px_4px_0_0_#F5B400] transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-20 bg-golden-yellow text-deep-black font-black text-2xl uppercase italic border-2 border-deep-black shadow-[8px_8px_0_0_#0A0A0A] hover:bg-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all duration-100"
            >
              {loading ? "AUTHENTICATING..." : "EXECUTE_LOGIN"}
            </Button>
          </form>

          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t-2 border-deep-black/20"></div>
            <span className="flex-shrink-0 mx-4 font-mono text-xs font-bold text-deep-black/60 uppercase">System Override</span>
            <div className="flex-grow border-t-2 border-deep-black/20"></div>
          </div>

          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google Authentication Failed")}
              theme="filled_black"
              shape="rectangular"
              size="large"
              text="continue_with"
              width="100%"
            />
          </div>

          <div className="flex justify-between items-center pt-8 border-t-2 border-deep-black/10">
            <p className="font-mono text-[10px] tracking-widest font-bold">UNAUTHORIZED ACCESS_PROHIBITED</p>
            <Link to="/register" className="font-black text-sm text-deep-black hover:text-golden-yellow uppercase italic tracking-tighter flex items-center gap-1 group">
              New Crew Member? <span className="text-golden-yellow group-hover:pl-2 transition-all">→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
