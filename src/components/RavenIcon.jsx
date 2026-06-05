import { RAVEN_ICON_MAP } from '../utils/ravenIconMap';

export default function RavenIcon({ itemId, iconFile, size = 32, className = '' }) {
  const file = iconFile || RAVEN_ICON_MAP[itemId];
  if (!file) return null;
  const src = file.includes('/') ? `/sprites/${file}` : `/sprites/raven-icons/${file}`;
  return (
    <img
      src={src}
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated' }}
      className={className}
      loading="lazy"
      alt=""
    />
  );
}
