import L from "leaflet";

const iconRetinaUrl = new URL("leaflet/dist/images/marker-icon-2x.png", import.meta.url).toString();
const iconUrl = new URL("leaflet/dist/images/marker-icon.png", import.meta.url).toString();
const shadowUrl = new URL("leaflet/dist/images/marker-shadow.png", import.meta.url).toString();
const redPinSvg = `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M32 2C20.4 2 11 11.4 11 23c0 14.3 12.7 27.7 19.4 34.5a2 2 0 0 0 2.8 0C40.9 50.7 53 38.4 53 23 53 11.4 43.6 2 32 2Z" fill="#f43f5e"/><circle cx="32" cy="24" r="9" fill="white"/></svg>`;
const redPinDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(redPinSvg)}`;

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
  iconUrl: redPinDataUrl,
  iconSize: [44, 44],
  iconAnchor: [22, 40],
  popupAnchor: [0, -34],
});

export const defaultMapCenter: L.LatLngLiteral = {
  lat: 13.736717,
  lng: 100.523186,
};

export type Coordinates = L.LatLngLiteral;

export const tileLayerUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

export const tileLayerAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
