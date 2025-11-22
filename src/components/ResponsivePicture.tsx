import type { Picture } from "imagetools-core";

interface ResponsivePictureProps {
  picture: Picture;
  alt: string;
  sizes: string;
  loading?: "lazy" | "eager";
  decoding?: "async" | "auto" | "sync";
  className?: string;
  imgClassName?: string;
  ariaHidden?: boolean;
}

export const ResponsivePicture = ({
  picture,
  alt,
  sizes,
  loading = "lazy",
  decoding = "async",
  className,
  imgClassName,
  ariaHidden,
}: ResponsivePictureProps) => (
  <picture className={className} aria-hidden={ariaHidden}>
    {Object.entries(picture.sources).map(([format, srcset]) => (
      <source key={format} srcSet={srcset} type={`image/${format}`} sizes={sizes} />
    ))}
    <img
      src={picture.img.src}
      width={picture.img.w}
      height={picture.img.h}
      alt={alt}
      loading={loading}
      decoding={decoding}
      className={imgClassName}
      sizes={sizes}
    />
  </picture>
);
