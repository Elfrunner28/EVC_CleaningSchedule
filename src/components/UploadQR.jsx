import React from "react";

export const UploadQR = () => {
  const uploadBase = "https://esp-project-1621c.web.app/upload.html";
  const ver = "2025-10-23-2"; // bump this on deploy (or use Date.now())
  const uploadURL = `${uploadBase}?v=${ver}`;
  const qrSrc =
    "https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=" +
    encodeURIComponent(uploadURL);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        right: 20,
        textAlign: "center",
      }}
    >
      <a
        href="https://esp-project-1621c.web.app/upload"
        target="_blank"
        rel="noopener noreferrer"
      >
        <img src={qrSrc} alt="Upload QR" width={200} height={200} />
      </a>
    </div>
  );
};
