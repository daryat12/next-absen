"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import React, { useEffect, useState, useRef } from "react";
import { default as AddIcon } from "@mui/icons-material/AddLocationAlt";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import SearchIcon from "@mui/icons-material/Search";
import MapIcon from "@mui/icons-material/Map";
import { LoadingOutlined, CloseOutlined } from "@ant-design/icons";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="fixed md:absolute flex flex-col gap-1 justify-center items-center h-full w-full text-gray-500">
      <MapIcon />
      <p>Loading map...</p>
    </div>
  ),
});

function SearchBox({ onSelectLocation, onResultsChange, locations, myCoords }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      // 🔍 Cari di lokasi lokal
      const localMatches = locations
        .filter((loc) => loc.name.toLowerCase().includes(query.toLowerCase()))
        .map((loc) => ({
          ...loc,
          source: "local",
          display_name: loc.name,
          lat: loc.lat,
          lon: loc.lng,
        }));

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
    }
  }, [query]);

  return (
    <div className="fixed md:absolute top-18 w-[90%] z-50">
      <form
        onChange={handleSearch}
        className={`flex h-12 bg-white shadow overflow-hidden items-center ${
          query && results.length > 0
            ? "rounded-b-none rounded-t-2xl"
            : "rounded-full"
        }`}
      >
        <input
          type="text"
          placeholder="Cari lokasi..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
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
            }}
            className="px-4 text-neutral-600 hover:text-blue-500 cursor-pointer transition"
          >
            {loading ? <LoadingOutlined /> : <CloseOutlined />}
          </button>
        )}
      </form>

      {query && results.length > 0 && (
        <ul className="absolute w-full bg-white pb-3 border-t border-gray-200 rounded-b-2xl max-h-[60vh] overflow-y-auto shadow text-left text-sm">
          {results.map((item, idx) => (
            <li
              key={idx}
              onClick={() => {
                onSelectLocation(item);
                setResults([]);
                setQuery(item.display_name.split(",")[0]);
              }}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
            >
              <span>{item.display_name}</span>
              <span>{item.source === "local" ? "📍" : ""}</span>
            </li>
          ))}
        </ul>
      )}
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
    <div className="flex flex-col items-center justify-center h-screen w-full text-center relative">
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
      />

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
        className="fixed font-bold md:absolute bottom-4 left-6 z-50 flex flex-col gap-2 justify-end items-end text-black/65 select-none tracking-[0.5px]"
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
        <div className="fixed md:absolute bottom-6 right-4 z-50 flex flex-col gap-2 justify-end items-end text-blue-500">
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
