import manifest from '../data/responsive-images.json';

export function responsiveImage(src: string, sizes = '(max-width: 760px) calc(100vw - 40px), (max-width: 1100px) 50vw, 600px') {
  const photo = manifest[src as keyof typeof manifest];
  return photo ? { srcset: photo.variants.map(image => `${image.src} ${image.width}w`).join(', '), sizes } : {};
}

export function responsiveAvif(src: string, sizes?: string) {
  const photo = manifest[src as keyof typeof manifest];
  return photo && 'avif' in photo ? { srcset: photo.avif.map(image => `${image.src} ${image.width}w`).join(', '), sizes: sizes ?? responsiveImage(src).sizes } : {};
}
