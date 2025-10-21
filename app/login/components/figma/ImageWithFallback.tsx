"use client";

import Image from "next/image";
import * as React from "react";

type ImageWithFallbackProps = {
  src: string;
  alt: string;
  className?: string;
};

const FALLBACK_SRC = "/brand/office-fallback.jpg";

export function ImageWithFallback({ src, alt, className }: ImageWithFallbackProps) {
  const [currentSrc, setCurrentSrc] = React.useState(src);

  React.useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  const wrapperClassName = ["relative", className].filter(Boolean).join(" ");
  const imageClassName = ["object-cover", className].filter(Boolean).join(" ");

  return (
    <div className={wrapperClassName}>
      <Image
        src={currentSrc}
        alt={alt}
        fill
        priority
        className={imageClassName}
        onError={() => {
          if (currentSrc !== FALLBACK_SRC) {
            setCurrentSrc(FALLBACK_SRC);
          }
        }}
      />
    </div>
  );
}
