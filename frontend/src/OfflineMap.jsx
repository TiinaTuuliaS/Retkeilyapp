import { useEffect, useState } from 'react';
import { ImageOverlay, Rectangle, useMap } from 'react-leaflet';

export default function OfflineMap({ pack }) {
  const map = useMap(), [url, setUrl] = useState(null);
  const b = pack.manifest.bounds;
  useEffect(() => {
    const objectUrl = URL.createObjectURL(pack.image);
    setUrl(objectUrl);
    const bounds = [[b[1], b[0]], [b[3], b[2]]];
    map.stop();
    map.fitBounds(bounds, { padding: [12, 12], animate: false });
    map.setMaxBounds(bounds);
    const before = map.getMaxZoom();
    map.setMaxZoom(16);
    const resize = () => { map.invalidateSize(); map.fitBounds(bounds, { padding: [12, 12], animate: false }); };
    window.addEventListener('resize', resize);
    return () => { window.removeEventListener('resize', resize); URL.revokeObjectURL(objectUrl); map.setMaxBounds(null); map.setMaxZoom(before); };
  }, [pack, map, b]);
  return <>
    {url && <ImageOverlay url={url} bounds={[[b[1], b[0]], [b[3], b[2]]]} attribution={pack.manifest.attribution} />}
    <Rectangle bounds={[[b[1], b[0]], [b[3], b[2]]]} pathOptions={{ color: '#007D64', weight: 2, fill: false }} interactive={false} />
  </>;
}
