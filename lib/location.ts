type PredictionLocation = {
  province: string;
  district?: string | null;
  sector?: string | null;
  cell?: string | null;
  village?: string | null;
};

export function predictionLocationName(location: PredictionLocation) {
  return (
    location.village ??
    location.cell ??
    location.sector ??
    location.district ??
    location.province
  );
}

export function predictionLocationPath(location: PredictionLocation) {
  return [
    location.province,
    location.district,
    location.sector,
    location.cell,
    location.village,
  ]
    .filter(Boolean)
    .join(" / ");
}
