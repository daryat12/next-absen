"use client";

import dynamic from "next/dynamic";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Empty, Image, Select } from "antd";
import { default as AddIcon } from "@mui/icons-material/AddLocationAlt";
import { default as PlacedIcon } from "@mui/icons-material/FmdGood";
import { LoadingOutlined, CloseOutlined, EyeOutlined } from "@ant-design/icons";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import MapIcon from "@mui/icons-material/Map";
import DirectionsIcon from "@mui/icons-material/Directions";
import BottomPopup from "@/components/BottomPopup";
import ShareIcon from "@mui/icons-material/Share";
import SettingsIcon from "@mui/icons-material/Settings";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="fixed md:absolute flex flex-col gap-1 justify-center items-center h-full w-full text-gray-500">
      <MapIcon />
      <p>Loading map...</p>
    </div>
  ),
});

const { Option } = Select;

function SearchBox({
  onSelectLocation,
  onResultsChange,
  onOverlayChange,
  locations,
  myCoords,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selected, setSelected] = useState(false);

  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;

    const R = 6371; // radius bumi (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // dalam kilometer
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      // 🔍 Cari di lokasi lokal
      const localMatches = locations
        .filter((loc) => {
          // 1. Ambil seluruh teks yang akan dicari (nama + alamat)
          const searchString = loc.name.toLowerCase();

          // 2. Pecah query menjadi kata-kata
          const queryWords = query
            .toLowerCase()
            .split(" ")
            .filter((word) => word.length > 0);

          return queryWords.every((word) => searchString.includes(word));
        })
        .map((loc) => ({
          // ... bagian map dan sort tetap sama ...
          ...loc,
          source: "local",
          display_name: loc.name,
          lat: loc.coords.lat,
          lon: loc.coords.lng,
          distanceKm: myCoords
            ? getDistanceKm(
                myCoords.lat,
                myCoords.lng,
                loc.coords.lat,
                loc.coords.lng
              )
            : null,
        }))
        .sort((a, b) => {
          // Kalau distance null, taruh di bawah
          if (a.distanceKm === null) return 1;
          if (b.distanceKm === null) return -1;

          return a.distanceKm - b.distanceKm; // ASC → terdekat dulu
        })
        .slice(0, 50);

      // // 🌍 Cari di OpenStreetMap
      // const res = await fetch(
      //   `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      //     query
      //   )}`
      // );
      // const apiData = await res.json();
      // const apiResults = apiData
      //   .slice(0, 5)
      //   .map((item) => ({ ...item, source: "osm" }));

      let customOption = [];
      if (myCoords) {
        if (query.toLowerCase().includes("terdekat")) {
          customOption = [
            {
              display_name: "Terdekat dari lokasi saya",
              source: "current",
              lat: null,
              lon: null,
            },
          ];
        }
      }

      // Gabungkan hasilnya (lokal dulu baru OSM)
      // const combinedResults = [...customOption, ...localMatches, ...apiResults];
      const combinedResults = [...customOption, ...localMatches];
      setResults(combinedResults);
      onResultsChange?.(combinedResults);
      onOverlayChange?.(true);
      setSelected(false);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query.trim() === "") {
      setResults([]);
      onResultsChange?.([]);
      setHasSearched(false);
      setSelected(false);
      onOverlayChange?.(false);
    }
  }, [query]);

  return (
    <div className="fixed md:absolute top-18 w-full z-20">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(); // panggil fungsi search saat submit
        }}
        className={`flex h-12 mx-5 px-1 bg-white rounded-full overflow-hidden items-center ${
          query ? "border border-gray-300" : "shadow"
        }`}
      >
        <div
          className={`pl-4 pr-2 ${selected ? "text-red-500" : "text-blue-500"}`}
        >
          <PlacedIcon />
        </div>

        <input
          type="text"
          placeholder="Cari lokasi..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyUp={(e) => {
            const val = e.target.value;
            setQuery(val);
            handleSearch();
            if (val.trim() !== "") onOverlayChange?.(true);
            else onOverlayChange?.(false);
          }}
          className="flex-grow py-2 outline-none text-sm"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              onResultsChange?.([]);
              setHasSearched(false);
              onOverlayChange?.(false);
            }}
            className="px-4 text-neutral-600 hover:text-blue-500 cursor-pointer transition"
          >
            {loading ? <LoadingOutlined /> : <CloseOutlined />}
          </button>
        )}
      </form>

      {query &&
        hasSearched &&
        (query.length <= 1 ? (
          // Query terlalu pendek → tampilkan Empty
          <div className="absolute top-18 w-full flex justify-center bg-white pb-3 h-[80vh] overflow-y-auto text-left text-sm select-none">
            <Empty
              description="Masukkan minimal 2 karakter untuk mencari."
              className="mt-35"
            />
          </div>
        ) : results.length > 0 ? (
          // Tampilkan hasil pencarian
          <div className="absolute top-15 w-full bg-white pb-3 text-left select-none">
            <span className="block text-xs font-semibold py-4 pl-6 pr-4">
              Hasil Pencarian
            </span>

            <div className="max-h-[74vh] overflow-y-auto">
              <ul className="w-full text-sm mb-10">
                {results.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => {
                      onSelectLocation(item);
                      setSelected(true);
                      onOverlayChange?.(false);
                      setHasSearched(false);
                      setResults([]);
                      setQuery(
                        item.display_name.split(",")[0]?.toUpperCase().trim()
                      );
                    }}
                    className="hover:bg-gray-100 cursor-pointer w-full"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col justify-center gap-1 ml-4 w-12 items-center">
                        <div className="bg-gray-200 p-1 flex justify-center items-center w-7 h-7 rounded-full">
                          <PlaceOutlinedIcon className="!h-5 !w-5" />
                        </div>
                        <span className="text-[11px] text-gray-400">
                          {item.distanceKm && item.distanceKm <= 101
                            ? item.distanceKm < 1
                              ? Math.round(item.distanceKm * 1000) + " m"
                              : item.distanceKm.toFixed(1) + " km"
                            : ""}
                        </span>
                      </div>

                      <div
                        className={`flex flex-1 items-center justify-between max-w-[83%] ml-2 py-5 pr-4 
                        ${
                          idx < results.length - 1 && "border-b border-gray-200"
                        }`}
                      >
                        <div className="flex flex-col max-w-[97%]">
                          <span className="font-semibold truncate">
                            {item.display_name
                              .split(",")[0]
                              ?.toUpperCase()
                              .trim()}
                          </span>

                          <span className="text-xs text-gray-400 truncate">
                            {item.display_name
                              .replace(
                                item.display_name.split(",")[0] + ",",
                                ""
                              )
                              .trim()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          // Tidak ada hasil
          <div className="absolute top-18 w-full flex justify-center bg-white pb-3 h-[80vh] overflow-y-auto text-left text-sm select-none">
            <Empty
              description="Data yang anda cari tidak ditemukan."
              className="mt-35"
            />
          </div>
        ))}
    </div>
  );
}

export default function LocationPage() {
  const router = useRouter();
  const mapRef = useRef(null);

  const [coords, setCoords] = useState(null);
  const [searchMarker, setSearchMarker] = useState(null);
  const [results, setResults] = useState([]);
  const [pinLocation, setPinLocation] = useState([]);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isSettingVisible, setIsSettingVisible] = useState(false);
  const [image, setImage] = useState(null);
  const [isImageValid, setIsImageValid] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [setting, setSetting] = useState({
    location: "hide",
    group: "yes",
  });
  const [applySetting, setApplySetting] = useState({
    locationDisable: true,
    cluster: false,
  });

  const baseUrl = `${process.env.NEXT_PUBLIC_BASE_API_URL}/public/pin_lokasi`;

  const extractSN = (text) => {
    if (!text) return null;
    const match = text.match(/\(SN:\s*([A-Z0-9-]+)\)/i);
    return match ? match[1] : null;
  };

  const fetchLocation = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CI_API_URL}/api/NextAbsen/getPinLokasi`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ci-Key": process.env.NEXT_PUBLIC_CI_KEY || "",
          },
        }
      );

      const result = await response.json();
      // Jika API mengembalikan status false, berhenti
      if (!result || !result.status) {
        setPinLocation([]);
        return;
      }

      const incoming = Array.isArray(result.data) ? result.data : [];

      setPinLocation(incoming);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    }
  };

  const DEFAULT_LOCATION = { lat: -7.383268097232734, lng: 121.78690970749423 };

  // Fungsi ambil lokasi GPS
  const detectLocation = (mode = "once") => {
    const successCallback = (pos) => {
      setCoords({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
    };
    const errorCallback = (err) => console.warn("geolocation error", err);

    if (mode === "once") {
      navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 60000,
      });
    } else if (mode === "watch") {
      const watchId = navigator.geolocation.watchPosition(
        successCallback,
        errorCallback,
        {
          enableHighAccuracy: true,
          timeout: 6000,
          maximumAge: 60000,
        }
      );
      return watchId;
    }
  };

  useEffect(() => {
    setPinLocation([]);
    fetchLocation();
    detectLocation("once");
    const watchId = detectLocation("watch"); // update lokasi real-time
    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    if (!results || results.length === 0) {
      setSearchMarker(null); // hilangkan marker pencarian
    }
  }, [results]);

  useEffect(() => {
    setImage(null);

    if (!selectedLocation) {
      setIsDetailVisible(false);
      return;
    }

    // Buka popup karena marker ada
    setIsDetailVisible(true);

    const sn = extractSN(selectedLocation.name);
    const imageName = `${sn}.png`;

    const imageUrl = `${baseUrl}/${imageName}`;

    setImage(imageUrl);
  }, [selectedLocation]);

  useEffect(() => {
    if (!image) {
      setIsImageValid(false);
      return;
    }

    const img = new window.Image();
    img.onload = () => setIsImageValid(true);
    img.onerror = () => setIsImageValid(false);
    img.src = image;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [image]);

  const lat = coords?.lat ?? DEFAULT_LOCATION.lat;
  const lng = coords?.lng ?? DEFAULT_LOCATION.lng;
  const center = [lat, lng];

  const listLocations = (pinLocation || []).map((item) => {
    let colorMarker = "#ff0000";
    if (item.office === "PT. RDN ARTHA GRAFIKA") colorMarker = "#12549a";

    return {
      id: item.id,
      office: item.office,
      area: item.area,
      name: item.name,
      coords: {
        lat: item.lat,
        lng: item.lng,
      },
      colorMarker,
    };
  });

  const isSameLocation = (
    current,
    target,
    currentZoom,
    targetZoom,
    offsetTarget = 0
  ) =>
    Math.abs(current.lat - (target.lat - offsetTarget)) < 0.0002 &&
    Math.abs(current.lng - target.lng) < 0.0002 &&
    currentZoom === targetZoom;

  const handleLocateMe = () => {
    if (!coords) {
      detectLocation("once");
      return;
    }

    if (!mapRef.current) return;

    const map = mapRef.current;

    const current = map.getCenter();
    const currentZoom = map.getZoom();

    const target = { lat: coords.lat, lng: coords.lng };
    const targetZoom = 18;

    // Jika posisi beda ATAU zoom beda → flyTo
    if (!current || !isSameLocation(current, target, currentZoom, targetZoom)) {
      map.flyTo([target.lat, target.lng], targetZoom);
    }
  };

  const handleShare = async () => {
    const url = `https://www.google.com/maps?q=${selectedLocation?.lat},${selectedLocation?.lng}`;

    if (!navigator.share) {
      await navigator.clipboard.writeText(url);
      alert("Link lokasi disalin ke clipboard!");
      return;
    }

    if (isSharing) return; // cegah double click

    try {
      setIsSharing(true);
      await navigator.share({
        title: "Lokasi",
        text: "Bagikan lokasi ini",
        url,
      });
    } catch (err) {
      console.log("Share dibatalkan atau error:", err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleChange = (key, value) => {
    setSetting((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Update applySetting berdasarkan setting saat submit
    const newApplySetting = {
      locationDisable: setting.location === "hide",
      cluster: setting.group === "yes",
    };

    setApplySetting(newApplySetting);
    setIsSettingVisible(false);
  };

  const handleReset = () => {
    setSetting({
      location: "hide",
      group: "yes",
    });
    setApplySetting({ locationDisable: true, cluster: false });
    setIsSettingVisible(false);
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-screen w-full text-center relative overflow-hidden">
      <SearchBox
        locations={listLocations}
        myCoords={coords}
        onSelectLocation={(item) => {
          const isNearest = item.display_name
            .toLowerCase()
            .includes("terdekat");

          const target = isNearest
            ? coords
            : { lat: parseFloat(item.lat), lng: parseFloat(item.lon) };

          if (!target || !mapRef.current) return;

          const map = mapRef.current;

          const current = map.getCenter();
          const currentZoom = map.getZoom();
          const targetZoom = 18;
          const offsetTarget = 0.001;

          if (
            !current ||
            !isSameLocation(
              current,
              target,
              currentZoom,
              targetZoom,
              offsetTarget
            )
          ) {
            map.flyTo([target.lat - offsetTarget, target.lng], targetZoom);
          }

          setSearchMarker(
            isNearest
              ? null
              : {
                  lat: target.lat,
                  lng: target.lng,
                  name: item.display_name,
                }
          );
          setSelectedLocation(
            isNearest
              ? null
              : {
                  lat: target.lat,
                  lng: target.lng,
                  name: item.display_name,
                }
          );
        }}
        onResultsChange={(res) => setResults(res)}
        onOverlayChange={(val) => setShowSearchOverlay(val)}
      />

      {showSearchOverlay && (
        <div className="absolute w-full h-full bg-white z-10"></div>
      )}

      <Map
        ref={mapRef}
        locations={listLocations}
        locationDisable={applySetting.locationDisable}
        center={center}
        userLocation={coords}
        cluster={applySetting.cluster}
        layer="clean"
        searchMarker={searchMarker}
        onDetailMarkerClick={() => setIsDetailVisible(true)}
        onSelectLocation={(loc) => setSelectedLocation(loc)}
        onSearchMarker={(loc) => setSearchMarker(loc)}
      />

      <div
        className="fixed font-bold md:absolute bottom-4 left-6 flex flex-col gap-2 justify-end items-end text-black/65 select-none tracking-[0.5px]"
        style={{
          textShadow: `
            2px 2px 0 white,
            -2px 2px 0 white,
            2px -2px 0 white,
            -2px -2px 0 white,
            0px 2px 0 white,
            2px 0px 0 white,
            0px -2px 0 white,
            -2px 0px 0 white
          `,
        }}
      >
        RDN Maps
      </div>

      <div className="fixed md:absolute bottom-6 right-4 flex flex-col gap-10 justify-end items-end text-blue-500">
        <div className="flex flex-col gap-4 justify-end items-center">
          <button
            onClick={() => {
              setIsDetailVisible(false);
              setIsSettingVisible(true);
            }}
            className="flex justify-center items-center bg-white px-4 py-2 cursor-pointer aspect-square w-14 h-auto rounded-3xl shadow-md"
            title="Pengaturan Map"
          >
            <SettingsIcon className="!w-7 !h-7" />
          </button>
        </div>
        {coords && (
          <div className="flex flex-col gap-4 justify-end items-center">
            <button
              onClick={handleLocateMe}
              className="flex justify-center items-center bg-white px-4 py-2 cursor-pointer aspect-square w-14 h-auto rounded-3xl shadow-md"
              title="Lokasi saya"
            >
              <MyLocationIcon className="!w-7 !h-7" />
            </button>
            <button
              onClick={() => router.push("/camera/set")}
              className="flex justify-center items-center bg-emerald-700 text-white px-4 py-2 cursor-pointer aspect-square w-14 h-auto rounded-3xl shadow-md"
              title="Pin lokasi baru"
            >
              <AddIcon className="!w-7 !h-7" />
            </button>
          </div>
        )}
      </div>

      {!showSearchOverlay && (
        <>
          <BottomPopup
            open={isSettingVisible}
            onClose={() => setIsSettingVisible(false)}
            title="Pengaturan Map"
          >
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Lokasi */}
              <div>
                <label className="block font-medium mb-1">Lokasi</label>
                <Select
                  value={setting.location}
                  onChange={(value) => {
                    // Update location
                    handleChange("location", value);

                    // Jika hide, otomatis set group ke "no"
                    if (value === "hide") {
                      handleChange("group", "no");
                    }
                  }}
                  className="w-full !h-10"
                >
                  <Option value="hide">Jangan tampilkan</Option>
                  <Option value="all">Tampilkan semua</Option>
                </Select>
              </div>

              {/* Kelompokan hanya ditampilkan jika location = all */}
              {setting.location === "all" && (
                <div>
                  <label className="block font-medium mb-1">Kelompokan</label>
                  <Select
                    value={setting.group}
                    onChange={(value) => handleChange("group", value)}
                    className="w-full !h-10"
                  >
                    <Option value="no">Tidak</Option>
                    <Option value="yes">Ya</Option>
                  </Select>
                </div>
              )}

              {/* Tombol aksi */}
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md cursor-pointer"
                >
                  Reset
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingVisible(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            </form>
          </BottomPopup>

          <BottomPopup
            open={isDetailVisible}
            onClose={() => {
              setIsDetailVisible(false);
              setImage(null);
            }}
            title="Detail"
            maxHight="70vh"
            backgroundOverlay={false}
            bodyPadding="0px"
          >
            <div>
              <div className="relative aspect-[16/9] w-full bg-gray-200 overflow-hidden group">
                {isImageValid ? (
                  <>
                    <Image
                      src={image}
                      className="object-cover w-full h-full object-center"
                      alt="Preview"
                    />

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-transparent text-sm transition-colors duration-200 group-hover:text-white">
                      <EyeOutlined className="mr-1" />
                      <span>Preview</span>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-sm transition-colors duration-200 text-black/30">
                    <span>No Image</span>
                  </div>
                )}
              </div>
              <div className="py-4 text-sm text-left space-y-3 select-text">
                <p className="px-8 font-semibold text-lg">
                  {selectedLocation?.name.split(",")[0]?.toUpperCase().trim()}
                </p>
                <div className="flex justify-around gap-4 mb-4 items-center border-t border-b border-gray-200 py-4 px-8">
                  {/* Rute di Google Maps */}
                  <div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedLocation?.lat},${selectedLocation?.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col justify-center items-center gap-0.5 !text-white"
                    >
                      <div className="flex items-center justify-center aspect-square w-10 rounded-full border p-1 bg-blue-500">
                        <DirectionsIcon />
                      </div>
                      <span className="text-blue-500 text-xs">Rute</span>
                    </a>
                  </div>

                  {/* Bagikan Lokasi */}
                  <div>
                    <button
                      onClick={handleShare}
                      className="flex flex-col justify-center items-center gap-0.5 !text-white cursor-pointer"
                    >
                      <div className="flex items-center justify-center aspect-square w-10 rounded-full border p-1 bg-blue-500">
                        <ShareIcon fontSize="small" />
                      </div>
                      <span className="text-blue-500 text-xs">Bagikan</span>
                    </button>
                  </div>
                </div>
                <div className="px-8 flex flex-col gap-2">
                  <div className="flex items-center gap-4">
                    <p className="flex justify-center items-center font-semibold text-blue-500 w-10 flex-shrink-0">
                      SN
                    </p>
                    <p className="text-xs">
                      {extractSN(selectedLocation?.name)?.toUpperCase().trim()}
                    </p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex justify-center items-center text-blue-500 w-10 flex-shrink-0">
                      <PlaceOutlinedIcon />
                    </div>
                    <p className="text-xs">
                      {selectedLocation?.name
                        ?.replace(selectedLocation.name.split(",")[0] + ",", "")
                        .replace(/\s*\(SN:\s*[A-Z0-9]+\)/, "")
                        .trim()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </BottomPopup>
        </>
      )}
    </div>
  );
}
