const API_BASE = "http://localhost:5000/api";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userType = location.state?.userType || "applicant";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    trn: "",
    dob: "",
    gender: "",
    mcj_reg_no: "",
    staff_id: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const payload: any = {
      username: formData.email,
      email: formData.email,
      password: formData.password,
      full_name: `${formData.firstName} ${formData.lastName}`,
    };

    let endpoint = "";

    if (userType === "applicant") {
      endpoint = "/applicants/register";
      Object.assign(payload, {
        trn: formData.trn,
        dob: formData.dob,
        gender: formData.gender,
      });
    } else if (userType === "doctor") {
      endpoint = "/doctor/register";
      Object.assign(payload, {
        mcj_reg_no: formData.mcj_reg_no,
        parish: formData.gender, // optional reuse
      });
    } else if (userType === "staff") {
      endpoint = "/staff/register";
      Object.assign(payload, {
        dob: formData.dob,
        gender: formData.gender,
        trn: formData.trn,
        staff_id: formData.staff_id,
      });
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed");
        return;
      }

      toast.success("Registration successful! Please log in.");
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error("Server error during registration");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-medical-light via-background to-accent p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="w-fit mb-4"
          >
            ← Back to Login
          </Button>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            Register as{" "}
            {userType === "applicant"
              ? "an Applicant"
              : userType === "doctor"
              ? "a Doctor"
              : "NHF Staff"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Common fields */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Extra fields depending on user type */}
            {userType === "applicant" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="trn">TRN</Label>
                  <Input
                    id="trn"
                    name="trn"
                    placeholder="123456789"
                    value={formData.trn}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Input
                    id="gender"
                    name="gender"
                    placeholder="Male / Female"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

            {userType === "doctor" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="mcj_reg_no">MCJ Registration No.</Label>
                  <Input
                    id="mcj_reg_no"
                    name="mcj_reg_no"
                    placeholder="D-12345"
                    value={formData.mcj_reg_no}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

            {userType === "staff" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="trn">TRN</Label>
                  <Input
                    id="trn"
                    name="trn"
                    placeholder="123456789"
                    value={formData.trn}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    name="dob"
                    type="date"
                    value={formData.dob}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Input
                    id="gender"
                    name="gender"
                    placeholder="Male / Female"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff_id">Staff ID</Label>
                  <Input
                    id="staff_id"
                    name="staff_id"
                    placeholder="NHF1234"
                    value={formData.staff_id}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

            {/* Password fields */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <Button type="submit" className="w-full">
              Register
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
