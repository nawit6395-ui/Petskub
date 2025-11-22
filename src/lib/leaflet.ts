import L from "leaflet";

const iconRetinaUrl = new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString();
const iconUrl = new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString();
const shadowUrl = new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString();
const customMarkerUrl = "https://img2.pic.in.th/pic/Petskub-2.png";

export const defaultMarkerIcon = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const locationMarkerIcon = L.icon({
  iconUrl: customMarkerUrl,
  iconSize: [44, 44],
  iconAnchor: [22, 40],
  popupAnchor: [0, -34],
});

export const defaultMapCenter: L.LatLngLiteral = {
  lat: 13.736717,
  lng: 100.523186,
};

export type Coordinates = L.LatLngLiteral;

const mapTilerApiKey = import.meta.env.VITE_MAPTILER_API_KEY;
const hasMapTilerKey = Boolean(mapTilerApiKey);

if (import.meta.env.DEV && !hasMapTilerKey) {
  console.warn("VITE_MAPTILER_API_KEY is missing. Falling back to OpenStreetMap tiles.");
}

const mapTilerAttribution =
  '© <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noreferrer">MapTiler</a> ' +
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>';

const openStreetMapAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export const tileLayerUrl = hasMapTilerKey
  ? `https://api.maptiler.com/maps/pastel/{z}/{x}/{y}.png?key=${mapTilerApiKey}`
  : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const tileLayerAttribution = hasMapTilerKey ? mapTilerAttribution : openStreetMapAttribution;

export const tileLayerOptions: L.TileLayerOptions = hasMapTilerKey
  ? {
      attribution: tileLayerAttribution,
      tileSize: 512,
      zoomOffset: -1,
      minZoom: 2,
      maxZoom: 19,
      detectRetina: true,
    }
  : {
      attribution: tileLayerAttribution,
    };
