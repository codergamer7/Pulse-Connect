// ApplicationDetailsDialog.tsx
const API_BASE = process.env.PRODUCTION?"https://pulse-connect-eight.vercel.app/api":"http://localhost:5000/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Application {
  id?: number;
  code?: string;
  full_name?: string;
  trn?: string;
  dob?: string;
  gender?: string;
  address?: string;
  phone?: string;
  parish?: string;
  condition?: string;
  created_at?: string;
}

interface Approval {
  status?: string;
  reviewer_username?: string | null;
  reviewed_at?: string | null;
  reason?: string | null;
}

interface Certification {
  doctor_name?: string;
  mcj_reg_no?: string;
  office_address?: string;
  parish?: string;
  office_phone?: string;
  certified_conditions?: string;
  certification_date?: string;
}

interface Props {
  application: {
    // surface card data you kept
    code: string;
    patientName: string;
    trn: string;
    submittedDate: string;
    status: "pending" | "approved" | "rejected";
    doctorName: string;
    conditionsCount: number;

    // full backend payload
    application: Application;
    certification: Certification | null;
    approval: Approval | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (code: string) => void;
  onReject: (code: string) => void;
  busyCode?: string | null;
}

export default function ApplicationDetailsDialog({
  application,
  open,
  onOpenChange,
  onApprove,
  onReject,
  busyCode,
}: Props) {
  const app = application.application || {};
  const cert = application.certification;
  const approval = application.approval || { status: "pending" };

  const code = app.code || application.code; // safe fallback

  const conditions =
    (cert?.certified_conditions
      ? cert.certified_conditions.split(",").map((s) => s.trim())
      : []) || (app.condition ? [app.condition] : []);

  const approving = busyCode === code;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Application Details</DialogTitle>
          <DialogDescription>
            Review complete application information before approval
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Personal Information</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Full Name</p>
                <p className="font-medium">{app.full_name || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">TRN</p>
                <p className="font-medium">{app.trn || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{app.dob || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Gender</p>
                <p className="font-medium">
                  {app.gender ? app.gender.charAt(0).toUpperCase() + app.gender.slice(1) : "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{app.phone || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Parish</p>
                <p className="font-medium">{app.parish || "—"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-muted-foreground">Mailing Address</p>
                <p className="font-medium">{app.address || "—"}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-muted-foreground">Submitted At</p>
                <p className="font-medium">
                  {app.created_at ? new Date(app.created_at).toLocaleString() : "—"}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Conditions */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-secondary">Medical Condition(s)</h3>
            {conditions.length > 0 ? (
              <div className="space-y-2">
                {conditions.map((c, i) => (
                  <div key={i} className="bg-accent p-3 rounded-lg">
                    <p className="font-medium">{c}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No conditions listed.</p>
            )}
          </div>

          <Separator />

          {/* Certification */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Doctor Certification</h3>
            {cert ? (
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Doctor Name</p>
                  <p className="font-medium">{cert.doctor_name || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">MCJ Reg No</p>
                  <p className="font-medium">{cert.mcj_reg_no || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Office Address</p>
                  <p className="font-medium">{cert.office_address || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Office Phone</p>
                  <p className="font-medium">{cert.office_phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Parish</p>
                  <p className="font-medium">{cert.parish || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Certification Date</p>
                  <p className="font-medium">{cert.certification_date || "—"}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No certification data available for this application.
              </p>
            )}
          </div>

          <Separator />

          {/* Approval */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-primary">Approval Information</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{approval.status || "pending"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Reviewed By</p>
                <p className="font-medium">{approval.reviewer_username || "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Reviewed At</p>
                <p className="font-medium">
                  {approval.reviewed_at ? new Date(approval.reviewed_at).toLocaleString() : "—"}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-muted-foreground">Reason</p>
                <p className="font-medium">{approval.reason || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="destructive"
            onClick={() => code && onReject(code)}
            disabled={!code || approving}
          >
            <XCircle className="w-4 h-4 mr-2" />
            {approving ? "Processing..." : "Reject Application"}
          </Button>
          <Button
            onClick={() => code && onApprove(code)}
            disabled={!code || approving}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {approving ? "Processing..." : "Approve Application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
