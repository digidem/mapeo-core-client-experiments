export interface Observation {
  lat: number;
  lon: number;
  tags?: {
    type: string;
  };
}
