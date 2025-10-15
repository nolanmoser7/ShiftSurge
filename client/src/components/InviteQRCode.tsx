import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InviteQRCodeProps {
  value: string;
  title?: string;
  description?: string;
  size?: number;
}

export function InviteQRCode({ value, title, description, size = 256 }: InviteQRCodeProps) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    toast({
      title: "Copied to clipboard",
      description: "Invite link copied successfully",
    });
  };

  const downloadQR = () => {
    const svg = document.getElementById('invite-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = size;
    canvas.height = size;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'admin-invite-qr.png';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Card data-testid="card-invite-qr">
      <CardHeader>
        {title && <CardTitle>{title}</CardTitle>}
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="bg-white p-4 rounded-md">
          <QRCodeSVG 
            id="invite-qr-code"
            value={value} 
            size={size}
            level="H"
            data-testid="qr-code-svg"
          />
        </div>
        
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={copyToClipboard}
            data-testid="button-copy-invite-link"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
          <Button 
            variant="outline"
            className="flex-1"
            onClick={downloadQR}
            data-testid="button-download-invite-qr"
          >
            <Download className="w-4 h-4 mr-2" />
            Download QR
          </Button>
        </div>

        <div className="w-full">
          <p className="text-xs text-muted-foreground break-all" data-testid="text-invite-url">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
