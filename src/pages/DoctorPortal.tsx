import { useState } from "react";
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
import { LogOut, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DoctorCertificationForm from "@/components/doctor/DoctorCertificationForm";

const API_BASE = "http://localhost:5000/api";

const DoctorPortal = () => {
  const navigate = useNavigate();
  const [applicationCode, setApplicationCode] = useState("");
  const [patientData, setPatientData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("user");
    toast.success("You’ve been logged out successfully.");
    navigate("/");
  };

  const handleSearch = async () => {
    if (!applicationCode.trim()) {
      toast.error("Please enter an application code");
      return;
    }

    try {
      setLoading(true);
      setPatientData(null);

      // ✅ Correct route for doctor application lookup
      const res = await fetch(`${API_BASE}/doctor/applications/${applicationCode}`);

      // ✅ Handle non-JSON or invalid responses safely
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Server returned non-JSON:", text);
        throw new Error("Unexpected server response");
      }

      // ✅ Handle HTTP errors
      if (!res.ok) {
        throw new Error(data.error || "Application not found");
      }

      // ✅ If backend flags that the app is already certified
      if (data.is_certified) {
        toast.error("This application has already been certified.");
        setPatientData(null);
        return;
      }

      // ✅ Build patient object for display
      const nameParts = (data.full_name || "").split(" ");
      setPatientData({
        code: data.code,
        firstName: nameParts[0] || "",
        middleName: nameParts[1] || "",
        surname: nameParts.slice(2).join(" ") || "",
        trn: data.trn,
        occupation: "N/A",
        gender: data.gender,
        homePhone: data.phone || "N/A",
        cellularPhone: data.phone || "N/A",
        mailingAddress: data.address || "N/A",
        parish: data.parish,
        condition: data.condition,
        dob: data.dob,
      });

      toast.success("Patient application found!");
    } catch (err: any) {
      console.error("Search error:", err);
      toast.error(err.message || "Failed to fetch application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-accent">
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-secondary">Doctor Portal</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Patient Application Lookup</CardTitle>
            <CardDescription>
              Enter the patient's application code to view and certify their application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="code" className="sr-only">
                  Application Code
                </Label>
                <Input
                  id="code"
                  placeholder="Enter application code (e.g., NHF-20251019-ABC123)"
                  value={applicationCode}
                  onChange={(e) => setApplicationCode(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  disabled={loading}
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {patientData && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium">
                      {patientData.firstName} {patientData.middleName}{" "}
                      {patientData.surname}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">TRN</p>
                    <p className="font-medium">{patientData.trn}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium">{patientData.gender}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Parish</p>
                    <p className="font-medium">{patientData.parish}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{patientData.mailingAddress}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <DoctorCertificationForm patientData={patientData} />
          </>
        )}
      </main>
    </div>
  );
};

export default DoctorPortal;
