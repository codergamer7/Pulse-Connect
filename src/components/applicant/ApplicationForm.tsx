const API_BASE = process.env.PRODUCTION?"https://pulse-connect-eight.vercel.app/api":"http://localhost:5000/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

interface ApplicationFormProps {
  onSubmit: (code: string) => void;
  applicationSubmitted: boolean;
  applicationCode: string;
}

const ApplicationForm = ({ onSubmit, applicationSubmitted, applicationCode }: ApplicationFormProps) => {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    surname: "",
    trn: "",
    occupation: "",
    gender: "",
    homePhone: "",
    cellularPhone: "",
    mailingAddress: "",
    guardianRelationship: "",
    guardianInstitution: "",
    guardianFirstName: "",
    guardianSurname: "",
    guardianMailingAddress: "",
    guardianTitle: "",
    guardianContactNumber: "",
    guardianIdentification: "",
    guardianIdType: "",
    guardianDate: "",
    guardianSignature: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const storedUser = localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;

    if (!user?.id) {
      toast.error("User information missing. Please log in again.");
      return;
    }

    const today = new Date();
    const formattedDate = today.toISOString().slice(0, 10);

    const payload = {
      user_id: user.id, // ✅ include this
      full_name: `${formData.firstName || ""} ${formData.middleName || ""} ${formData.surname || ""}`.trim(),
      trn: formData.trn || "",
      dob: formData.guardianDate || formattedDate,
      gender: formData.gender || "Unspecified",
      address: formData.mailingAddress || "",
      phone: formData.cellularPhone || formData.homePhone || "",
      parish: "Kingston",
      condition: formData.guardianRelationship || "General",
    };

    if (!payload.full_name || !payload.trn || !payload.gender) {
      toast.error("Please fill out all required fields before submitting.");
      return;
    }

    const res = await fetch(`${API_BASE}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Backend error:", data);
      throw new Error(data.error || "Application submission failed");
    }

    toast.success(`Application submitted successfully! Code: ${data.code}`);
    onSubmit(data.code);
  } catch (err: any) {
    console.error("Submission error:", err);
    toast.error(err.message || "Unexpected error occurred");
  }
};


  // ✅ Show confirmation after submission
  if (applicationSubmitted) {
    return (
      <Card className="p-8 text-center bg-success/5 border-success">
        <div className="text-6xl mb-4">✓</div>
        <h3 className="text-2xl font-bold text-success mb-2">Application Submitted</h3>
        <p className="text-muted-foreground mb-4">
          Your application has been submitted successfully. Please provide this code to your doctor:
        </p>
        <div className="bg-card p-4 rounded-lg border-2 border-success inline-block">
          <p className="text-xs text-muted-foreground mb-1">Application Code</p>
          <p className="text-2xl font-mono font-bold text-success">{applicationCode}</p>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Keep this code safe. Your doctor will need it to access your application.
        </p>
      </Card>
    );
  }

  // ✅ Main form
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section A - Personal Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-primary">Section A: Personal Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="middleName">Middle Name</Label>
            <Input
              id="middleName"
              value={formData.middleName}
              onChange={(e) => handleChange("middleName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="surname">Surname *</Label>
            <Input
              id="surname"
              value={formData.surname}
              onChange={(e) => handleChange("surname", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trn">TRN *</Label>
            <Input
              id="trn"
              value={formData.trn}
              onChange={(e) => handleChange("trn", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="occupation">Occupation *</Label>
            <Input
              id="occupation"
              value={formData.occupation}
              onChange={(e) => handleChange("occupation", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="homePhone">Home Phone *</Label>
            <Input
              id="homePhone"
              type="tel"
              value={formData.homePhone}
              onChange={(e) => handleChange("homePhone", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cellularPhone">Cellular Phone *</Label>
            <Input
              id="cellularPhone"
              type="tel"
              value={formData.cellularPhone}
              onChange={(e) => handleChange("cellularPhone", e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="mailingAddress">Mailing Address *</Label>
            <Input
              id="mailingAddress"
              value={formData.mailingAddress}
              onChange={(e) => handleChange("mailingAddress", e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Section B - Guardian Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-primary">Section B: Guardian Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="guardianRelationship">Type of Relationship</Label>
            <Input
              id="guardianRelationship"
              value={formData.guardianRelationship}
              onChange={(e) => handleChange("guardianRelationship", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianInstitution">Name of Institution</Label>
            <Input
              id="guardianInstitution"
              value={formData.guardianInstitution}
              onChange={(e) => handleChange("guardianInstitution", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianFirstName">Guardian First Name</Label>
            <Input
              id="guardianFirstName"
              value={formData.guardianFirstName}
              onChange={(e) => handleChange("guardianFirstName", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianSurname">Guardian Surname</Label>
            <Input
              id="guardianSurname"
              value={formData.guardianSurname}
              onChange={(e) => handleChange("guardianSurname", e.target.value)}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="guardianMailingAddress">Guardian Mailing Address</Label>
            <Input
              id="guardianMailingAddress"
              value={formData.guardianMailingAddress}
              onChange={(e) => handleChange("guardianMailingAddress", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianTitle">Title</Label>
            <Input
              id="guardianTitle"
              value={formData.guardianTitle}
              onChange={(e) => handleChange("guardianTitle", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianContactNumber">Contact Number</Label>
            <Input
              id="guardianContactNumber"
              type="tel"
              value={formData.guardianContactNumber}
              onChange={(e) => handleChange("guardianContactNumber", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianIdentification">Identification</Label>
            <Input
              id="guardianIdentification"
              value={formData.guardianIdentification}
              onChange={(e) => handleChange("guardianIdentification", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianIdType">ID Type</Label>
            <Select value={formData.guardianIdType} onValueChange={(value) => handleChange("guardianIdType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select ID type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="drivers-license">Driver's License</SelectItem>
                <SelectItem value="passport">Passport</SelectItem>
                <SelectItem value="voter-id">Voter ID</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianDate">Date</Label>
            <Input
              id="guardianDate"
              type="date"
              value={formData.guardianDate}
              onChange={(e) => handleChange("guardianDate", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardianSignature">Signature (Type Name)</Label>
            <Input
              id="guardianSignature"
              value={formData.guardianSignature}
              onChange={(e) => handleChange("guardianSignature", e.target.value)}
              placeholder="Type your full name"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" size="lg" className="min-w-[200px]">
          Submit Application
        </Button>
      </div>
    </form>
  );
};

export default ApplicationForm;
