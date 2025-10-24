"use client";
import { useEffect, useState } from "react";

export function UploadQR({
  href = "https://esp-project-1621c.web.app/upload.html",
  size = 200,
  className = "",
  inline = true, // when true, no absolute positioning
}) {
  const [qrSrc, setQrSrc] = useState("");

  useEffect(() => {
    const ver = Date.now();
    const url = `${href}?v=${ver}`;
    setQrSrc(
      `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
        url
      )}`
    );
  }, [href, size]);

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
