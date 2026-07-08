import QRCode from "qrcode";
import { generateQrData } from "@/lib/utils";

/**
 * Generate a QR code as a data URL (base64 PNG) for a registration.
 */
export async function generateRegistrationQR(registrationId: string): Promise<string> {
  const data = generateQrData(registrationId);
  const dataUrl = await QRCode.toDataURL(data, {
    width: 300,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
  return dataUrl;
}

/**
 * Generate a QR code as an SVG string.
 */
export async function generateRegistrationQRSvg(registrationId: string): Promise<string> {
  const data = generateQrData(registrationId);
  const svg = await QRCode.toString(data, { type: "svg" });
  return svg;
}
