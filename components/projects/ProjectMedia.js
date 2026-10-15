"use client";
import Image from "next/image";
import { useState } from "react";

export default function ProjectMedia({ image, title, category = "robotics", sizes = "(max-width: 640px) 100vw, (max-width: 1080px) 50vw, 33vw" }) {
  const [failed, setFailed] = useState(false);
  return <span className={`kes-project-media kes-project-media--${category}`}>
    {image && !failed ? <Image src={image.src} alt={image.alt || title} fill sizes={sizes} onError={() => setFailed(true)} /> : <span className="kes-project-placeholder" role="img" aria-label={`${image ? "Photograph unavailable" : "Project photograph not supplied"}: ${title}`}>
      <svg viewBox="0 0 320 180" aria-hidden="true" fill="none"><path d="M0 90h80m160 0h80M160 0v32m0 116v32" /><circle cx="160" cy="90" r="57" /><circle cx="160" cy="90" r="35" /><path d="m124 54 72 72m-72 0 72-72M104 90h112M160 34v112" /><circle cx="80" cy="90" r="5" /><circle cx="240" cy="90" r="5" /></svg>
    </span>}
  </span>;
}
