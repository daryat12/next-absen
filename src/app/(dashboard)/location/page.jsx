"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { default as AddIcon } from "@mui/icons-material/AddLocationAlt";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import SearchIcon from "@mui/icons-material/Search";
import MapIcon from "@mui/icons-material/Map";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { LoadingOutlined, CloseOutlined } from "@ant-design/icons";
import { Empty } from "antd";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="fixed md:absolute flex flex-col gap-1 justify-center items-center h-full w-full text-gray-500">
      <MapIcon />
      <p>Loading map...</p>
    </div>
  ),
});

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
          lat: loc.lat,
          lon: loc.lng,
          distanceKm: myCoords
            ? getDistanceKm(myCoords.lat, myCoords.lng, loc.lat, loc.lng)
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
      onOverlayChange?.(false);
    }
  }, [query]);

  return (
    <div className="fixed md:absolute top-18 w-full z-50">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(); // panggil fungsi search saat submit
        }}
        className={`flex h-12 mx-5 bg-white rounded-full overflow-hidden items-center ${
          query ? "border border-gray-300" : "shadow"
        }`}
      >
        <input
          type="text"
          placeholder="Cari lokasi..."
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            handleSearch();
            if (val.trim() !== "") onOverlayChange?.(true);
            else onOverlayChange?.(false);
          }}
          className="flex-grow pl-5 pr-3 py-2 outline-none text-sm"
        />

        <button
          type="submit"
          className={`text-neutral-600 hover:text-blue-500 cursor-pointer transition ${
            query ? "px-0" : "px-4"
          }`}
        >
          <SearchIcon />
        </button>

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
        (results.length > 0 ? (
          <div className="absolute top-15 w-full bg-white px-2 pb-3 text-left select-none">
            {/* Header — tidak ikut scroll */}
            <span className="block text-xs font-semibold p-4">
              Hasil Pencarian
            </span>

            {/* Bagian scroll — hanya list saja */}
            <div className="max-h-[74vh] overflow-y-auto">
              <ul className="w-full text-sm">
                {results.map((item, idx) => (
                  <li
                    key={idx}
                    onClick={() => {
                      onSelectLocation(item);
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
                      <div className="flex flex-col justify-center gap-0.5 ml-2 w-12 items-center">
                        <div className="bg-gray-200 p-1 flex justify-center items-center w-6 h-6 rounded-full">
                          <PlaceOutlinedIcon className="!h-4 !w-4" />
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {item.distanceKm && item.distanceKm <= 101
                            ? item.distanceKm < 1
                              ? Math.round(item.distanceKm * 1000) + " m"
                              : item.distanceKm.toFixed(1) + " km"
                            : ""}
                        </span>
                      </div>

                      <div
                        className={`flex flex-1 items-center justify-between max-w-[83%] ml-2 py-4 pr-2 
                        ${
                          idx < results.length - 1
                            ? "border-b border-gray-200"
                            : "mb-10"
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

  const lat = coords?.lat ?? DEFAULT_LOCATION.lat;
  const lng = coords?.lng ?? DEFAULT_LOCATION.lng;
  const center = [lat, lng];

  const listLocations = pinLocation;

  const handleLocateMe = () => {
    if (coords && mapRef.current) {
      mapRef.current.flyTo([coords.lat, coords.lng], 18);
    } else {
      detectLocation("once");
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-screen w-full text-center relative">
      <SearchBox
        locations={listLocations}
        myCoords={coords}
        onSelectLocation={(item) => {
          if (item.display_name.toLowerCase().includes("terdekat")) {
            // Arahkan ke lokasi pengguna sendiri
            if (coords && mapRef.current) {
              mapRef.current.flyTo([coords.lat, coords.lng], 16);
              setSearchMarker(null); // hilangkan marker pencarian
            }
            return;
          }

          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);

          if (mapRef.current) {
            mapRef.current.flyTo([lat, lon], 16);
          }

          setSearchMarker({
            lat,
            lng: lon,
            name: item.display_name,
          });
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
        locationDisable={true}
        center={center}
        userLocation={coords}
        cluster={false}
        layer="clean"
        searchMarker={searchMarker}
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

      {coords && (
        <div className="fixed md:absolute bottom-6 right-4 flex flex-col gap-2 justify-end items-end text-blue-500">
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
        </div>
      )}
    </div>
  );
}
