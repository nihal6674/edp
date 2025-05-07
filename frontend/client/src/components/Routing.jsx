import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

const Routing = ({ from, via, to }) => {
  const map = useMap();

  useEffect(() => {
    if (!from || !to) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(from[0], from[1]),
        via ? L.latLng(via[0], via[1]) : null,
        L.latLng(to[0], to[1]),
      ].filter(Boolean),
      lineOptions: {
        styles: [{ color: "#1e90ff", weight: 6 }],
      },
      createMarker: () => null,
      show: false,
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      routeWhileDragging: false,
      router: L.Routing.osrmv1({
        serviceUrl: "https://router.project-osrm.org/route/v1",
      }),
      // 👇 This is what fills the #leaflet-routing-panel
      routeWhileDragging: false,
      showAlternatives: false,
      collapsible: true,
      container: document.getElementById("leaflet-routing-panel"),
    }).addTo(map);

    return () => {
      map.removeControl(routingControl);
    };
  }, [from, via, to]);

  return null;
};

export default Routing;
