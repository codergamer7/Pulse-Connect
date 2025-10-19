import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, FileText, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ApplicationForm from "@/components/applicant/ApplicationForm";
import DigitalCard from "@/components/applicant/DigitalCard";
import { toast } from "sonner";

const API_BASE = process.env.PRODUCTION?"https://pulse-connect-eight.vercel.app/api":"http://localhost:5000/api";

const ApplicantPortal = () => {
  const navigate = useNavigate();
  const [application, setApplication] = useState<any>(null);
  const [approvalStatus, setApprovalStatus] = useState<string>("pending");
  const [member, setMember] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = () => {
    localStorage.removeItem("user");
    toast.success("You’ve been logged out.");
    navigate("/");
  };

useEffect(() => {
  const fetchData = async () => {
    if (!user) return;

    try {
      // Applications
      const appsRes = await fetch(`${API_BASE}/applications`);
      if (!appsRes.ok) throw new Error("Failed to fetch applications");
      const data = await appsRes.json();
      const allApps = Array.isArray(data) ? data : data.applications || [];

      if (!Array.isArray(allApps)) {
        console.error("Applications response is not an array:", allApps);
        setLoading(false);
        return;
      }

      const existing = allApps.find(
        (a: any) =>
          a.trn === user.trn ||
          a.username === user.username ||
          a.email === user.email
      );

      if (!existing) {
        console.log("No matching application found for user:", user);
        setLoading(false);
        return;
      }

      setApplication(existing);

      // Approvals
    const approvalRes = await fetch(`${API_BASE}/staff/applications/${existing.code}`);
    const approvalData = await approvalRes.json();
    if (approvalRes.ok && approvalData.approval) {
      setApprovalStatus(approvalData.approval.status);
    }

      // Membership
      const memberRes = await fetch(`${API_BASE}/members/${existing.trn}`);
      if (memberRes.ok) {
        const memberData = await memberRes.json();
        if (memberData && !memberData.error) {
          setMember(memberData);
        }
      }
    } catch (err) {
      console.error("Error loading applicant data:", err);
      toast.error("Failed to load your data.");
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [user]);


  const handleApplicationSubmit = (code: string) => {
    setApplication({ code });
    setApprovalStatus("pending");
    toast.success(`Application submitted successfully! Code: ${code}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading your data...</p>
      </div>
    );
  }

  const isApproved = approvalStatus === "approved";
  const isPending = approvalStatus === "pending";
  const isRejected = approvalStatus === "rejected";

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-accent">
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Applicant Portal</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue={isApproved ? "card" : "application"} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="application" disabled={isApproved}>
              <FileText className="w-4 h-4 mr-2" />
              Application
            </TabsTrigger>
            <TabsTrigger value="card" disabled={!isApproved}>
              <CreditCard className="w-4 h-4 mr-2" />
              View Card
            </TabsTrigger>
          </TabsList>

          {/* ===== Application Tab ===== */}
          <TabsContent value="application" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Health Fund Application</CardTitle>
                <CardDescription>
                  {application
                    ? isApproved
                      ? "Your application has been approved."
                      : isPending
                      ? "Your application is under review."
                      : isRejected
                      ? "Your application was rejected. You may reapply."
                      : "Application submitted."
                    : "Complete the form below to apply for the NHF Health Fund."}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {application ? (
                  <div className="space-y-3">
                    <p>
                      <strong>Application Code:</strong> {application.code}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span
                        className={
                          isApproved
                            ? "text-green-600"
                            : isPending
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                      >
                        {approvalStatus || "Pending"}
                      </span>
                    </p>
                    {!isApproved && (
                      <p className="text-sm text-muted-foreground">
                        You cannot submit another application until this one is resolved.
                      </p>
                    )}
                  </div>
                ) : (
                  <ApplicationForm onSubmit={handleApplicationSubmit} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== Digital Card Tab ===== */}
          <TabsContent value="card" className="mt-6">
            {isApproved && member ? (
              <DigitalCard member={member} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Digital NHF Card</CardTitle>
                  <CardDescription>
                    {isPending
                      ? "Your card will be available once approved."
                      : "No card available yet."}
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ApplicantPortal;
