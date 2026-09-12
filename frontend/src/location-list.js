export const hasPoint = location => Number.isFinite(location.latitude) && Number.isFinite(location.longitude);

export function filterLocations(all, scoped, search, bounds) {
  const query = search.trim().toLocaleLowerCase('fi');
  if (query) return all.filter(location => location.name.toLocaleLowerCase('fi').includes(query));
  if (!bounds) return [];
  return scoped.filter(location => {
    if (!hasPoint(location) || location.latitude < bounds.south || location.latitude > bounds.north) return false;
    // Leaflet may return longitudes outside -180…180 after panning across world copies.
    const width = bounds.east - bounds.west;
    const offset = ((location.longitude - bounds.west) % 360 + 360) % 360;
    return width >= 360 || offset <= width + 1e-9;
  });
}
