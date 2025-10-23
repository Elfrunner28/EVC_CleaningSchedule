"use client";
import { useEffect, useState } from "react";

export function UploadQR({
  href = "https://YOUR_PROJECT.web.app/upload.html",
  size = 200,
  className = "",
  inline = true, // when true, no absolute positioning
}) {
  const [qrSrc, setQrSrc] = useState("");

  useEffect(() => {
    // build-time or fixed version recommended to avoid hydration issues
    const ver = process.env.NEXT_PUBLIC_QR_VER ?? "v1";
    const url = `${href}?v=${ver}`;
    setQrSrc(
      `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
        url
      )}`
    );
  }, [href, size]);

  // inline=true -> no absolute positioning; let parent control spacing
  const wrapperStyle = inline
    ? {}
    : { position: "absolute", bottom: 20, right: 20 };

  if (!qrSrc) return null;

  return (
    <div style={wrapperStyle} className={className}>
      <a href={href} target="_blank" rel="noopener noreferrer">
        <img src={qrSrc} alt="Upload QR" width={size} height={size} />
      </a>
    </div>
  );
}
