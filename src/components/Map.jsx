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
  Circle,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import ReactDOMServer from "react-dom/server";
import { Divider } from "antd";
import DirectionsIcon from "@mui/icons-material/Directions";
import ImageIcon from "@mui/icons-material/Image";

// Cluster icon
function ClusterIcon({ count }) {
  return (
    <div className="bg-red-500 text-white border-2 border-white rounded-full w-10 h-10 flex items-center justify-center font-bold shadow">
      {count}
    </div>
  );
}

// Cluster layer
function ClusterLayer({ locations }) {
  const map = useMap();

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
      const marker = L.circleMarker([loc.lat, loc.lng], {
        radius: 10,
        color: loc.colorMarker || "#ff0000",
        fillColor: loc.colorMarker || "#ff0000",
        fillOpacity: 0.5,
        weight: 2,
      });
      marker.bindPopup(`
        <div>
          <div class="mb-4">${loc.name}</div>
          <hr class="mt-0 mb-2 !text-gray-200" />
          <div class="w-1/3">
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-2 !text-white"
            >
              <div class="flex items-center justify-center rounded-full border p-1 bg-blue-500">
                <svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeSmall css-120dh41-MuiSvgIcon-root" focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="DirectionsIcon">
                  <path d="m21.41 10.59-7.99-8c-.78-.78-2.05-.78-2.83 0l-8.01 8c-.78.78-.78 2.05 0 2.83l8.01 8c.78.78 2.05.78 2.83 0l7.99-8c.79-.79.79-2.05 0-2.83M13.5 14.5V12H10v3H8v-4c0-.55.45-1 1-1h4.5V7.5L17 11z"></path>
                </svg>
              </div>
              <span class="text-blue-500">Lihat Rute</span>
            </a>
          </div>
        </div>
      `);
      markers.addLayer(marker);
    });

    map.addLayer(markers);
    return () => map.removeLayer(markers);
  }, [map, locations]);

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

const searchIcon = L.divIcon({
  html: `<img src="/map/icon/marker-red.png" />`,
  className: "bg-transparent", // 🔥 animasi bounce
  iconSize: [40, 40],
  iconAnchor: [20, 40], // titik bawah tengah
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
    },
    ref
  ) => {
    const mapRef = useRef();
    const [showImage, setShowImage] = useState(false);
    const [currentUserLocation, setCurrentUserLocation] =
      useState(userLocation);
    const baseUrl = `${process.env.NEXT_PUBLIC_BASE_API_URL}/public/pin_lokasi`;

    const extractSN = (text) => {
      if (!text) return null;
      const match = text.match(/\(SN:\s*([A-Z0-9]+)\)/);
      return match ? match[1] : null;
    };

    const sn = extractSN(searchMarker?.name); // hasil: "DFW14146"
    const imageName = `${sn}.png`;

    useImperativeHandle(ref, () => ({
      flyTo: (coords, zoom = 18) => {
        if (mapRef.current)
          mapRef.current.flyTo(coords, zoom, { animate: true, duration: 1 });
      },
    }));

    useEffect(() => {
      setCurrentUserLocation(userLocation);
    }, [userLocation]);

    // console.log(center);

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

          {/* Lokasi Pengguna */}
          {currentUserLocation && (
            <UserLocationMarker currentUserLocation={currentUserLocation} />
          )}

          {/* Lokasi pelanggan */}
          {!locationDisable && (
            <>
              {cluster ? (
                <ClusterLayer locations={locations} />
              ) : (
                locations.map((loc) => (
                  <CircleMarker
                    key={loc.id}
                    center={[loc.lat, loc.lng]}
                    radius={8}
                    color={loc.colorMarker || "#ff0000"}
                    fillColor={loc.colorMarker || "#ff0000"}
                    fillOpacity={0.5}
                    weight={2}
                  >
                    <Popup>
                      <div>
                        <div className="mb-4">{loc.name}</div>
                        <Divider className="!mt-0 !mb-2" />
                        <div className="w-1/3">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${loc.lat},${loc.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 !text-white"
                          >
                            <div className="flex items-center justify-center rounded-full border p-1 bg-blue-500">
                              <DirectionsIcon fontSize="small" />
                            </div>
                            <span className="text-blue-500">Lihat Rute</span>
                          </a>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))
              )}
            </>
          )}

          {/* Lokasi pencarian */}
          {searchMarker && (
            <Marker
              position={[searchMarker.lat, searchMarker.lng]}
              icon={searchIcon}
              zIndexOffset={500}
            >
              <Popup>
                <div>
                  <div className="mb-4">{searchMarker.name}</div>
                  <Divider className="!mt-0 !mb-2" />
                  <div className="flex gap-4 items-center">
                    <div className="w-1/3">
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${searchMarker.lat},${searchMarker.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 !text-white"
                      >
                        <div className="flex items-center justify-center rounded-full border p-1 bg-blue-500">
                          <DirectionsIcon fontSize="small" />
                        </div>
                        <span className="text-blue-500">Lihat Rute</span>
                      </a>
                    </div>
                    {sn && (
                      <div
                        className="flex items-center gap-2 text-white cursor-pointer"
                        onClick={() => setShowImage(!showImage)}
                      >
                        <div className="flex items-center justify-center rounded-full border p-1 bg-blue-500">
                          <ImageIcon fontSize="small" />
                        </div>
                        <span className="text-blue-500">Lihat Gambar</span>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
        {showImage && (
          <div
            className="absolute top-14 left-0 z-[1000] 
                     bg-white w-full h-[calc(100vh-56px)] flex flex-col"
          >
            {/* Bagian gambar */}
            <div className="flex-1 bg-white overflow-hidden">
              <img
                src={`${baseUrl}/${imageName}`}
                alt="Preview"
                className="object-cover w-full h-full object-center"
              />
            </div>

            {/* Tombol */}
            <div className="p-3 bg-white">
              <button
                className="bg-gray-400 hover:bg-gray-500 text-sm text-white rounded-md w-full h-9 cursor-pointer"
                onClick={() => setShowImage(false)}
              >
                Tutup Gambar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

export default Map;
