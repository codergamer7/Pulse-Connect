// StaffPortal.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, FileCheck, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import ApplicationDetailsDialog from "@/components/staff/ApplicationDetailsDialog";

const API_BASE = "http://localhost:5000/api";

interface Application {
  id: string;
  code: string;
  patientName: string;
  trn: string;
  submittedDate: string;
  status: "pending" | "approved" | "rejected";
  doctorName: string;
  conditionsCount: number;
}

export default function StaffPortal() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busyCode, setBusyCode] = useState<string | null>(null);

  // fetch list (keeps original list design)
  const defFetch = async () => {
    try {
      const res = await fetch(`${API_BASE}/applications?limit=100`);
      const data = await res.json();
      const mapped = (data.applications || []).map((a: any, idx: number) => ({
        id: String(idx + 1),
        code: a.code,
        patientName: a.full_name,
        trn: a.trn,
        submittedDate: a.created_at,
        status: (a.status as Application["status"]) || "pending",
        doctorName: a.doctor_name || "—",
        conditionsCount: a.condition ? 1 : 0,
      }));
      setApplications(mapped);
    } catch (e: any) {
      toast.error(e?.message || "Failed to load applications");
    }
  };

  useEffect(() => {
    defFetch();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    toast.success("You’ve been logged out successfully.");
    navigate("/");
  };

  // show details uses /applications/:code to get full record (application + certification + approval)
  const handleViewDetails = async (app: Application) => {
    try {
      setBusyCode(app.code);
      const res = await fetch(`${API_BASE}/staff/applications/${app.code}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to fetch details");

      // keep the same dialog look, but feed real backend object
      setSelectedApplication({
        ...app,          // keep surface fields for header badges etc.
        application: data.application,
        certification: data.certification,
        approval: data.approval,
      });
      setDialogOpen(true);
    } catch (err: any) {
      toast.error(err.message || "Could not load details");
    } finally {
      setBusyCode(null);
    }
  };

  // unified approve/reject
  const approveOrReject = async (code: string, action: "approved" | "rejected") => {
    try {
      setBusyCode(code);
      const res = await fetch(`${API_BASE}/staff/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_code: code,
          action,
          reviewer_username: "staff",  // or actual logged-in username if you have it
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action}`);

      toast.success(
        action === "approved" ? "Application approved" : "Application rejected"
      );

      // refresh list
      await defFetch();

      // refresh the selected dialog data if it’s open for this code
    if (selectedApplication?.application?.code === code) {
      const r = await fetch(`${API_BASE}/staff/applications/${code}`);
      const fresh = await r.json();

      if (r.ok) {
        setSelectedApplication((prev: any) => ({
          ...prev,
          application: fresh.application,
          certification: fresh.certification,
          approval: fresh.approval,
        }));
      }
    } 
    } catch (err: any) {
      toast.error(err.message || "Action failed");
    } finally {
      setBusyCode(null);
      setDialogOpen(false);
    }
  };

  const handleApprove = (code: string) => approveOrReject(code, "approved");
  const handleReject = (code: string) => approveOrReject(code, "rejected");

  const pendingApplications = applications.filter((a) => a.status === "pending");

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-light via-background to-accent">
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-medical-blue">NHF Staff Portal</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Applications
                </CardTitle>
                <CardDescription>Review and process submitted applications</CardDescription>
              </div>
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {pendingApplications.length} Applications
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApplications.length === 0 ? (
                <div className="text-center py-12">
                  <FileCheck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Applications</h3>
                  <p className="text-muted-foreground">All applications have been processed</p>
                </div>
              ) : (
                pendingApplications.map((app) => (
                  <Card key={app.id} className="border-2">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{app.patientName}</h3>
                            <Badge variant="outline">{app.code}</Badge>
                          </div>
                          <div className="grid md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                            <p className="text-muted-foreground">
                              <span className="font-medium">TRN:</span> {app.trn}
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium">Doctor:</span> {app.doctorName}
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium">Submitted:</span> {app.submittedDate}
                            </p>
                            <p className="text-muted-foreground">
                              <span className="font-medium">Conditions:</span> {app.conditionsCount}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => handleViewDetails(app)}
                          disabled={busyCode === app.code}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {busyCode === app.code ? "Loading..." : "View Details"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {selectedApplication && (
          <ApplicationDetailsDialog
            application={selectedApplication}     // pass the whole object
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onApprove={(code) => handleApprove(code)}  // pass code
            onReject={(code) => handleReject(code)}    // pass code
            busyCode={busyCode}
          />
        )}
      </main>
    </div>
  );
}
