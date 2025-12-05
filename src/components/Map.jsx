"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
} from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  CircleMarker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import ReactDOMServer from "react-dom/server";

// Cluster icon
function ClusterIcon({ count }) {
  return (
    <div className="bg-red-500 text-white border-2 border-white rounded-full w-10 h-10 flex items-center justify-center font-bold shadow">
      {count}
    </div>
  );
}

// Cluster layer
function ClusterLayer({
  locations,
  searchMarker,
  onDetailMarkerClick,
  onSearchMarker,
  onSelectLocation,
}) {
  const map = useMap();
  const radiusMeter = 50;

  const distanceInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // meter
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  useEffect(() => {
    if (!map || !locations?.length) return;

    const markers = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          html: ReactDOMServer.renderToString(<ClusterIcon count={count} />),
          className: "custom-cluster",
          iconSize: [40, 40],
        });
      },
    });

    locations.forEach((loc) => {
      let hide = false;

      if (searchMarker) {
        const dist = distanceInMeters(
          searchMarker.lat,
          searchMarker.lng,
          loc.lat,
          loc.lng
        );

        // hide jika: sama persis atau terlalu dekat
        hide =
          (loc.lat === searchMarker.lat &&
            loc.lng === searchMarker.lng &&
            loc.name === searchMarker.name) ||
          dist <= radiusMeter;
      }

      if (hide) return;

      const marker = L.circleMarker([loc.lat, loc.lng], {
        radius: 10,
        color: loc.colorMarker || "#ff0000",
        fillColor: loc.colorMarker || "#ff0000",
        fillOpacity: 0.5,
        weight: 2,
      });

      marker.on("click", (e) => {
        L.DomEvent.stopPropagation(e);

        onDetailMarkerClick?.(loc);
        onSearchMarker?.({
          lat: loc.lat,
          lng: loc.lng,
          name: loc.name,
        });
        onSelectLocation?.({
          lat: loc.lat,
          lng: loc.lng,
          name: loc.name,
        });
      });

      markers.addLayer(marker);
    });

    map.addLayer(markers);

    return () => {
      map.removeLayer(markers);
    };
  }, [map, locations, searchMarker]); // <- Tambahkan di sini

  return null;
}

function createUserIcon(photo) {
  const userOutlinedSVG = `
  <svg viewBox="64 64 896 896" focusable="false" data-icon="user" width="1em" height="1em" fill="currentColor" aria-hidden="true">
    <path d="M858.5 763.6a374 374 0 00-80.6-119.5 375.63 375.63 0 00-119.5-80.6c-.4-.2-.8-.3-1.2-.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-.4.2-.8.3-1.2.5-44.8 18.9-85 46-119.5 80.6a375.63 375.63 0 00-80.6 119.5A371.7 371.7 0 00136 901.8a8 8 0 008 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c.1 4.4 3.6 7.8 8 7.8h60a8 8 0 008-8.2c-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z">
    </path>
  </svg>
  `;

  const imageHtml = photo
    ? `<img src="${photo}" class="w-full h-full rounded-full object-cover" />`
    : `${userOutlinedSVG}`;

  return L.divIcon({
    html: `
      <div class="flex flex-col items-center">
      
        <div class="w-[56px] h-[56px] rounded-full overflow-hidden flex justify-center items-center border-2 border-blue-300 shadow bg-gray-400 text-4xl text-white">
          <div class="w-[52px] h-[52px] rounded-full overflow-hidden flex justify-center items-center border-3 border-white bg-gray-300/50 text-2xl text-white">
            ${imageHtml}
          </div>
        </div>

        <div class="relative flex flex-col items-center">
          <div class="w-[6px] h-[6px] bg-white rounded-full z-10"></div>
          <div class="w-6 h-[6px] bg-black/60 rounded-full blur-[4px] -mt-1"></div>
        </div>
      </div>
    `,
    className: "user-marker",
    iconSize: [56, 62],
    iconAnchor: [28, 62],
  });
}

function UserLocationMarker({ currentUserLocation: user }) {
  const [userImage, setUserImage] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const userEmailList = JSON.parse(localStorage.getItem("userEmail")) || [];

    if (storedUser) {
      const match = userEmailList.find(
        (item) => item.email === storedUser.username
      );

      setUserImage({
        photo: match?.photo || null,
      });
    }
  }, []);

  return (
    <Marker
      position={[user.lat, user.lng]}
      icon={createUserIcon(userImage?.photo)}
    />
  );
}

function MapClickHandler({ onClearSearch }) {
  useMapEvents({
    dblclick() {
      onClearSearch();
    },
  });
  return null;
}

const searchIconWithLabel = (name) =>
  L.divIcon({
    className: "custom-search-label",
    html: `
      <div class="flex items-center gap-1 w-50 pointer-events-none">
        <img
          src="/map/icon/marker-red.png"
          class="w-10 h-10 pointer-events-auto"
        />
        <span
          class="absolute top-1 left-10 text-left text-xs w-40 font-semibold whitespace-normal pointer-events-none"
          style="
            text-shadow:
              1px 1px 0 white,
              -1px 1px 0 white,
              1px -1px 0 white,
              -1px -1px 0 white,
              0px 1px 0 white,
              1px 0px 0 white,
              0px -1px 0 white,
              -1px 0px 0 white;
          "
        >
          ${name}
        </span>
      </div>
    `,
    iconSize: [0, 0], // biar bounding box native tidak dipakai
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

const Map = forwardRef(
  (
    {
      locations = [],
      locationDisable = false,
      center = [],
      userLocation = null,
      cluster = true,
      layer = "default",
      searchMarker = null,
      onDetailMarkerClick,
      onSelectLocation,
      onSearchMarker,
    },
    ref
  ) => {
    const mapRef = useRef();
    const [currentUserLocation, setCurrentUserLocation] =
      useState(userLocation);

    useImperativeHandle(ref, () => ({
      flyTo: (coords, zoom = 18) => {
        if (mapRef.current)
          mapRef.current.flyTo(coords, zoom, { animate: true, duration: 1 });
      },
      getCenter: () => {
        if (mapRef.current) return mapRef.current.getCenter();
        return null;
      },
      getZoom: () => {
        if (mapRef.current) return mapRef.current.getZoom();
        return null;
      },
    }));

    useEffect(() => {
      setCurrentUserLocation(userLocation);
    }, [userLocation]);

    const layerUrl =
      layer === "clean"
        ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    return (
      <div className="w-full h-full overflow-hidden relative">
        <MapContainer
          center={center}
          zoom={3}
          scrollWheelZoom={true}
          className="h-full w-full z-0"
          zoomControl={false}
          ref={mapRef}
        >
          <TileLayer url={layerUrl} />

          <MapClickHandler onClearSearch={() => onSearchMarker(null)} />

          {/* Lokasi Pengguna */}
          {currentUserLocation && (
            <UserLocationMarker currentUserLocation={currentUserLocation} />
          )}

          {/* Lokasi pelanggan */}
          {!locationDisable && (
            <>
              {cluster ? (
                <ClusterLayer
                  locations={locations}
                  searchMarker={searchMarker}
                  onDetailMarkerClick={onDetailMarkerClick}
                  onSearchMarker={onSearchMarker}
                  onSelectLocation={onSelectLocation}
                />
              ) : (
                <>
                  {locations.map((loc) => {
                    const isSameMarker =
                      searchMarker &&
                      loc.lat === searchMarker.lat &&
                      loc.lng === searchMarker.lng &&
                      loc.name === searchMarker.name;

                    // Jika marker ini cocok dengan searchMarker → skip (hide)
                    if (isSameMarker) return null;

                    return (
                      <CircleMarker
                        key={loc.id}
                        center={[loc.lat, loc.lng]}
                        radius={8}
                        color={loc.colorMarker || "#ff0000"}
                        fillColor={loc.colorMarker || "#ff0000"}
                        fillOpacity={0.5}
                        weight={2}
                        eventHandlers={{
                          click: (e) => {
                            L.DomEvent.stopPropagation(e);

                            if (onDetailMarkerClick) onDetailMarkerClick();

                            if (onSearchMarker) {
                              onSearchMarker({
                                lat: loc.lat,
                                lng: loc.lng,
                                name: loc.name,
                              });
                            }
                            if (onSelectLocation) {
                              onSelectLocation({
                                lat: loc.lat,
                                lng: loc.lng,
                                name: loc.name,
                              });
                            }
                          },
                        }}
                      />
                    );
                  })}
                </>
              )}
            </>
          )}

          {/* Lokasi pencarian */}
          {searchMarker && (
            <Marker
              position={[searchMarker.lat, searchMarker.lng]}
              icon={searchIconWithLabel(
                searchMarker.name.split(",")[0]?.toUpperCase().trim()
              )}
              zIndexOffset={500}
              eventHandlers={{
                click: (e) => {
                  L.DomEvent.stopPropagation(e);

                  if (onDetailMarkerClick) onDetailMarkerClick();
                  if (onSearchMarker) {
                    onSearchMarker({
                      lat: searchMarker.lat,
                      lng: searchMarker.lng,
                      name: searchMarker.name,
                    });
                  }
                  if (onSelectLocation) {
                    onSelectLocation({
                      lat: searchMarker.lat,
                      lng: searchMarker.lng,
                      name: searchMarker.name,
                    });
                  }
                },
              }}
            />
          )}
        </MapContainer>
      </div>
    );
  }
);

export default Map;
