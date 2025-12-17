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
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import ReactDOMServer from "react-dom/server";

function LocationMarkerSVG() {
  return (
    <svg
      fill="currentColor"
      width="1em"
      height="1em"
      version="1.1"
      id="Capa_1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="-29.7 -29.7 356.40 356.40"
      xmlSpace="preserve"
    >
      <g strokeWidth="0"></g>
      <g
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="#fcfcfc"
        strokeWidth="40"
      >
        <path
          d="M148.5,0C85.646,0,34.511,51.136,34.511,113.989c0,25.11,8.008,48.926,23.157,68.873 
          c13.604,17.914,32.512,31.588,53.658,38.904l27.464,68.659c1.589,3.971,5.434,6.574,9.71,6.574c4.276,0,8.121-2.603,9.71-6.574 
          l27.464-68.659c21.146-7.316,40.054-20.99,53.658-38.904c15.149-19.947,23.157-43.763,23.157-68.873 
          C262.489,51.136,211.354,0,148.5,0z M148.5,72.682c22.777,0,41.308,18.53,41.308,41.308c0,22.777-18.53,41.309-41.308,41.309 
          c-22.777,0-41.308-18.531-41.308-41.309C107.192,91.212,125.723,72.682,148.5,72.682z"
        />
      </g>

      <g>
        <path
          d="M148.5,0C85.646,0,34.511,51.136,34.511,113.989c0,25.11,8.008,48.926,23.157,68.873 
          c13.604,17.914,32.512,31.588,53.658,38.904l27.464,68.659c1.589,3.971,5.434,6.574,9.71,6.574c4.276,0,8.121-2.603,9.71-6.574 
          l27.464-68.659c21.146-7.316,40.054-20.99,53.658-38.904c15.149-19.947,23.157-43.763,23.157-68.873 
          C262.489,51.136,211.354,0,148.5,0z M148.5,72.682c22.777,0,41.308,18.53,41.308,41.308c0,22.777-18.53,41.309-41.308,41.309 
          c-22.777,0-41.308-18.531-41.308-41.309C107.192,91.212,125.723,72.682,148.5,72.682z"
        />
      </g>
    </svg>
  );
}

function ClusterIcon({ count, color }) {
  return (
    <div
      style={{ backgroundColor: color }}
      className="text-white border-2 border-white rounded-full w-10 h-10 flex items-center justify-center font-bold shadow"
    >
      {count}
    </div>
  );
}

function ClusterLayer({
  locations,
  clusterSort,
  searchMarker,
  onSearchMarker,
  flyToMarker,
}) {
  const map = useMap();
  const radiusMeter = 50;

  const distanceInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const getGroupKey = (loc) => {
    if (clusterSort === "area") return loc.area || "UNKNOWN";
    if (clusterSort === "office") return loc.office || "UNKNOWN";
    return "ALL";
  };

  const getGroupColor = (loc) => {
    if (clusterSort === "area") return loc.areaColor || "#ff0000";
    if (clusterSort === "office") return loc.officeColor || "#ff0000";
    return loc.officeColor || "#ff0000";
  };

  useEffect(() => {
    if (!map || !locations?.length) return;

    const grouped = {};
    locations.forEach((loc) => {
      const key = getGroupKey(loc);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(loc);
    });

    const clusterGroups = [];

    Object.keys(grouped).forEach((groupKey) => {
      const firstLoc = grouped[groupKey][0];
      const groupColor = getGroupColor(firstLoc);

      const cluster = L.markerClusterGroup({
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        // disableClusteringAtZoom: 18,
        // maxClusterRadius: 60,
        iconCreateFunction: (cluster) => {
          const count = cluster.getChildCount();
          return L.divIcon({
            html: ReactDOMServer.renderToString(
              <ClusterIcon count={count} color={groupColor} />
            ),
            className: "custom-cluster",
            iconSize: [40, 40],
          });
        },
      });

      grouped[groupKey].forEach((loc) => {
        let hide = false;

        if (searchMarker) {
          const dist = distanceInMeters(
            searchMarker.lat,
            searchMarker.lng,
            loc.coords.lat,
            loc.coords.lng
          );

          hide =
            (loc.coords.lat === searchMarker.lat &&
              loc.coords.lng === searchMarker.lng &&
              loc.name === searchMarker.name) ||
            dist <= radiusMeter;
        }

        if (hide) return;

        const iconHtml = ReactDOMServer.renderToString(
          <div
            style={{
              color: groupColor,
              fontSize: "30px",
              lineHeight: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LocationMarkerSVG />
          </div>
        );

        const marker = L.marker([loc.coords.lat, loc.coords.lng], {
          icon: L.divIcon({
            html: iconHtml,
            className: "custom-marker-icon",
            iconSize: [30, 30],
            iconAnchor: [15, 30],
          }),
        });

        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);

          flyToMarker?.(loc.coords.lat, loc.coords.lng, 10);

          onSearchMarker?.({
            lat: loc.coords.lat,
            lng: loc.coords.lng,
            name: loc.name,
          });
        });

        cluster.addLayer(marker);
      });

      map.addLayer(cluster);
      clusterGroups.push(cluster);
    });

    return () => {
      clusterGroups.forEach((cg) => map.removeLayer(cg));
    };
  }, [map, locations, searchMarker]);

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
        <div id="select-marker-icon" class="text-red-500 text-[40px] pointer-events-auto stroke-1 stroke-white">
          <svg
            width="1em"
            height="1em"
            fill="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2c-4.2 0-8 3.22-8 8.2 0 3.32 2.67 7.25 8 11.8 5.33-4.55 8-8.48 8-11.8C20 5.22 16.2 2 12 2m0 10c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2"></path>
          </svg>
        </div>
        <span
          class="absolute top-1 left-10 text-left text-xs text-red-400 w-40 font-semibold whitespace-normal pointer-events-none"
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
    iconSize: [0, 0],
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
      clusterSort = "all",
      layer = "default",
      searchMarker = null,
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

    const getMarkerColor = (loc) => {
      if (clusterSort === "area") return loc.areaColor || "#ff0000";
      if (clusterSort === "office") return loc.officeColor || "#ff0000";
      return loc.officeColor || "#ff0000";
    };

    const flyToMarker = (lat, lng, zoom = 18, duration = 1, offset = 0) => {
      const map = mapRef.current?._map || mapRef.current;
      if (!map || !map.flyTo) return;

      map.flyTo(
        {
          lat: lat - offset,
          lng,
        },
        map.getZoom() < zoom ? zoom : map.getZoom(),
        {
          animate: true,
          duration,
        }
      );
    };

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

          <MapClickHandler
            onClearSearch={() => {
              onSearchMarker(null);
              onSelectLocation(null);
            }}
          />

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
                  clusterSort={clusterSort}
                  searchMarker={searchMarker}
                  onSearchMarker={onSearchMarker}
                  flyToMarker={flyToMarker}
                />
              ) : (
                <>
                  {locations.map((loc) => {
                    const isSameMarker =
                      searchMarker &&
                      loc.coords.lat === searchMarker.lat &&
                      loc.coords.lng === searchMarker.lng &&
                      loc.name === searchMarker.name;

                    // Jika marker ini cocok dengan searchMarker → skip (hide)
                    if (isSameMarker) return null;

                    return (
                      <Marker
                        key={loc.id}
                        position={[loc.coords.lat, loc.coords.lng]}
                        icon={L.divIcon({
                          html: ReactDOMServer.renderToString(
                            <div
                              style={{
                                color: getMarkerColor(loc),
                                fontSize: "32px", // kontrol ukuran marker (setara 1em)
                                lineHeight: 0,
                              }}
                            >
                              <LocationMarkerSVG />
                            </div>
                          ),
                          className: "custom-marker",
                          iconSize: [32, 32],
                          iconAnchor: [16, 32], // titik bawah SVG
                        })}
                        eventHandlers={{
                          click: (e) => {
                            L.DomEvent.stopPropagation(e);

                            flyToMarker(loc.coords.lat, loc.coords.lng, 10);

                            if (onSearchMarker) {
                              onSearchMarker({
                                lat: loc.coords.lat,
                                lng: loc.coords.lng,
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

                  flyToMarker(searchMarker.lat, searchMarker.lng, 18, 1, 0.001);

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
