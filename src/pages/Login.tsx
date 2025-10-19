const API_BASE = "http://localhost:5000/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserCircle, Stethoscope, Building2 } from "lucide-react";

type UserType = "applicant" | "doctor" | "staff" | null;

const Login = () => {
  const [userType, setUserType] = useState<UserType>(null);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailOrUsername || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: emailOrUsername, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Invalid credentials");
        return;
      }

      // ✅ Store user info
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: data.id, // 👈 store user ID from backend
          username: data.username,
          role: data.role,
        })
      );

      toast.success("Login successful!");

      // 🚀 Redirect based on role
      switch (data.role) {
        case "applicant":
          navigate("/applicant");
          break;
        case "doctor":
          navigate("/doctor");
          break;
        case "staff":
          navigate("/staff");
          break;
        default:
          navigate("/");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to connect to the server");
    }
  };

  const handleRegister = () => {
    navigate("/register", { state: { userType } });
  };

  if (!userType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-light via-background to-accent p-4">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-2">NHF Portal</h1>
            <p className="text-muted-foreground">Select your user type to continue</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-primary"
              onClick={() => setUserType("applicant")}
            >
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <UserCircle className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Applicant</CardTitle>
                <CardDescription>Submit and manage your health fund applications</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-secondary"
              onClick={() => setUserType("doctor")}
            >
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4">
                  <Stethoscope className="w-8 h-8 text-secondary" />
                </div>
                <CardTitle>Doctor</CardTitle>
                <CardDescription>Review and certify patient applications</CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-medical-blue"
              onClick={() => setUserType("staff")}
            >
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-medical-blue/10 rounded-full flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-medical-blue" />
                </div>
                <CardTitle>NHF Staff</CardTitle>
                <CardDescription>Review and approve applications</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-light via-background to-accent p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button
            variant="ghost"
            onClick={() => setUserType(null)}
            className="w-fit mb-4"
          >
            ← Back
          </Button>
          <CardTitle className="text-2xl capitalize">{userType} Login</CardTitle>
          <CardDescription>Enter your credentials to access your portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>Email or Username</Label>
              <Input
                type="text"
                placeholder="Enter your email or username"
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full">Login</Button>
            <div className="text-center pt-4">
              <p className="text-sm text-muted-foreground">
                Don’t have an account?{" "}
                <button
                  type="button"
                  onClick={handleRegister}
                  className="text-primary hover:underline font-medium"
                >
                  Register here
                </button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
