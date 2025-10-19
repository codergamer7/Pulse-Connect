import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import QRCode from "react-qr-code";

interface DigitalCardProps {
  member: {
    full_name: string;
    trn: string;
    member_number: string;
    valid_from: string;
  };
}

const DigitalCard: React.FC<DigitalCardProps> = ({ member }) => {
  const [showTRN, setShowTRN] = useState(true);

  if (!member) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-6 text-center text-muted-foreground">
          No NHF card data available.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="overflow-hidden bg-gradient-to-br from-primary to-secondary text-white shadow-2xl">
        <CardContent className="p-8">
          {/* ===== Header ===== */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-sm font-medium opacity-90">National Health Fund</h2>
              <h1 className="text-3xl font-bold mt-1">Member Card</h1>
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg">
              <p className="text-xs opacity-90">Valid From</p>
              <p className="text-sm font-bold">{member.valid_from}</p>
            </div>
          </div>

          {/* ===== Member Info ===== */}
          <div className="space-y-4 mb-6">
            <div>
              <p className="text-sm opacity-90">Member Name</p>
              <p className="text-2xl font-bold">{member.full_name}</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <p className="text-sm opacity-90">TRN Number</p>
                <p className="text-xl font-mono font-bold">
                  {showTRN ? member.trn : "•••-•••-•••"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTRN(!showTRN)}
                className="text-white hover:bg-white/20"
              >
                {showTRN ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div>
              <p className="text-sm opacity-90">Member Number</p>
              <p className="text-lg font-mono font-bold">{member.member_number}</p>
            </div>
          </div>

          {/* ===== QR Code Section ===== */}
          <div className="flex justify-between items-end">
            <div className="bg-white p-4 rounded-lg">
              <QRCode
                value={JSON.stringify(member)}
                size={120}
                level="H"
              />
            </div>
            <div className="text-right">
              <p className="text-xs opacity-75">Scan QR code at healthcare facilities</p>
              <p className="text-xs opacity-75 mt-1">for instant verification</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DigitalCard;
