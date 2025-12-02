"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Form, Input, Alert, Spin } from "antd";
import { snapdom } from "@zumer/snapdom";
import {
  CameraOutlined,
  ReloadOutlined,
  CheckOutlined,
  SwapOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import BottomPopup from "@/components/BottomPopup";

function Timer({ time }) {
  return (
    <>
      {time && (
        <div className="pl-3 pr-2 py-1 text-2xl font-bold text-black">
          {time.hours}.{time.minutes}
        </div>
      )}
    </>
  );
}

export default function CheckDetail() {
  const defaultTime = { hours: "", minutes: "", seconds: "" };

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const captureRef = useRef(null);
  const shutterAudioRef = useRef(null);

  const [error, setError] = useState(null);
  const [cameraReady, setCameraReady] = useState(true);
  const [photo, setPhoto] = useState(null);
  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState(null);
  const [locError, setLocError] = useState(null);
  const [videoKey, setVideoKey] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [time, setTime] = useState(defaultTime);
  const [isLoading, setIsLoading] = useState(false);
  const [saveCoords, setSaveCoords] = useState(null);
  const [saveAddress, setSaveAddress] = useState(null);
  const [saveTime, setSaveTime] = useState(defaultTime);
  const [alertConfig, setAlertConfig] = useState({
    show: false,
    type: "info",
    message: "",
  });
  const [percent, setPercent] = useState(-50);

  const showAlert = (type, message, duration = 5000) => {
    setAlertConfig({ show: true, type, message });
    setTimeout(
      () => setAlertConfig({ show: false, type: "", message: "" }),
      duration
    );
  };

  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const namaHalaman =
    {
      in: "Masuk",
      out: "Pulang",
      set: "Lokasi",
    }[id] || null;

  const colorMap = {
    in: "bg-[#2b7fff]", // biru
    out: "bg-[#ff6900]", // oranye
    set: "bg-[#00c950]", // hijau
  };
  const colorMapBorder = {
    in: "border-[#2b7fff]", // biru
    out: "border-[#ff6900]", // oranye
    set: "border-[#00c950]", // hijau
  };

  const cameraDefault = id === "set" ? "environment" : "user";

  const [facingMode, setFacingMode] = useState(cameraDefault);

  const logoWatermark = "/camera/ext/logo.png";
  const soundCamera = "/camera/ext/shutter.mp3";

  const disableBack = () => {
    window.onpopstate = function () {
      return false;
    };
  };

  const enableBack = () => {
    window.onpopstate = null;
  };

  const fetchData = async (data) => {
    setIsLoading(true);
    disableBack();
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CI_API_URL}/api/NextAbsen/insAbsen`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ci-Key": process.env.NEXT_PUBLIC_CI_KEY || "",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (result.status) {
        setIsLoading(false);
        showAlert("success", result.message);
        // reset state setelah upload
        setSaveCoords(null);
        setSaveAddress(null);
        setSaveTime(defaultTime);
        enableBack();
        setTimeout(() => {
          router.back();
          setPhoto(null);
        }, 1500);
      } else {
        showAlert("danger", result.message || "Gagal menyimpan data!");
      }
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
    }
  };

  const fetchLocation = async (data) => {
    setIsLoading(true);
    disableBack();
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CI_API_URL}/api/NextAbsen/insPinLokasi`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ci-Key": process.env.NEXT_PUBLIC_CI_KEY || "",
          },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (result.status) {
        setIsLoading(false);
        setIsDetailVisible(false);
        showAlert("success", result.message);
        // reset state setelah upload
        setSaveCoords(null);
        setSaveAddress(null);
        setSaveTime(defaultTime);
        enableBack();
        setTimeout(() => {
          router.back();
          setPhoto(null);
        }, 1500);
      } else {
        showAlert("danger", result.message || "Gagal menyimpan data!");
      }
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
    }
  };

  // Auto scroll ke bawah
  const scrollToBottom = () =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });

  // Fungsi stop kamera
  const stopCamera = () => {
    const s = streamRef.current;
    if (s) {
      s.getTracks().forEach((t) => t.stop());
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    streamRef.current = null;
  };

  // Fungsi mulai kamera
  const startCamera = async (mode = "user") => {
    try {
      stopCamera();
      setError(null);
      setCameraReady(false);

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = newStream;

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;

        // 🧠 Tunggu sampai metadata siap sebelum play()
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current
              .play()
              .then(() => {
                setCameraReady(true);
                resolve();
              })
              .catch((err) => console.warn("Video play error:", err));
          };
        });
      }
    } catch (err) {
      console.error("startCamera error", err);
      setError("Tidak bisa mengakses kamera. Pastikan izin kamera aktif.");
    }
  };

  // Dapatkan lokasi GPS
  const detectLocation = (mode = "once") => {
    // setCoords({
    //   lat: -6.1234567,
    //   lng: 106.1234567,
    //   accuracy: 10.12,
    // });
    // return;

    if (!navigator.geolocation) {
      setLocError("Geolocation tidak tersedia di browser ini.");
      return null;
    }

    const successCallback = (pos) => {
      setCoords({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
      setLocError(null);
    };

    const errorCallback = (err) => {
      console.warn("geolocation error", err);
      setLocError("Tidak dapat mendeteksi lokasi. Periksa izin lokasi.");
    };

    if (mode === "once") {
      navigator.geolocation.getCurrentPosition(successCallback, errorCallback, {
        enableHighAccuracy: true,
        timeout: 6000,
        maximumAge: 60000,
      });
      return null;
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

  // Dapatkan alamat dari titik lokasi
  const getAddressFromCoords = async (lat, lon) => {
    // return setAddress(
    //   "Jl. Test, Kelurahan, Kecamatan, Provinsi, Kodepos, Negara"
    // );

    try {
      const res = await fetch(`/api/reverse?lat=${lat}&lon=${lon}`);
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setAddress("(Gagal mendapatkan alamat)");
        return;
      }
      setAddress(json.data.display_name || "(Alamat tidak tersedia)");
    } catch (e) {
      console.error("fetch reverse error:", e);
      setAddress("(Gagal mendapatkan alamat)");
    }
  };

  // Fungsi ambil screenshot html2canvas
  const takePhoto = async () => {
    if (isLoading) return;
    if (locError !== null || address === null) {
      showAlert(
        "warning",
        locError
          ? locError
          : !address
          ? "Harap tunggu. Sedang mendeteksi alamat."
          : "Harap tunggu..."
      );
      return;
    }

    try {
      // 🔊 Mainkan suara shutter
      shutterAudioRef.current && shutterAudioRef.current.play();

      const video = videoRef.current;
      const el = captureRef.current;

      // 🎞️ 1️⃣ Capture frame dari video ke canvas
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      // 🔹 Apply filter seperti CSS
      ctx.filter = `
        brightness(1.2)
        contrast(0.80)
        saturate(1.3)
        hue-rotate(0deg)
        drop-shadow(0 0 1px rgba(255,255,255,0.1))
      `;

      // 🔹 Cek kamera depan untuk mirror
      if (facingMode === "user") {
        ctx.save();
        ctx.scale(-1, 1); // flip horizontal
        ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        // kamera belakang, draw normal
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      }

      // 🔹 Convert ke data URL
      const frameDataUrl = canvas.toDataURL("image/png");

      // 🧩 2️⃣ Buat elemen <img> sementara di atas video
      const imgOverlay = document.createElement("img");
      imgOverlay.src = frameDataUrl;
      imgOverlay.className =
        "absolute top-0 left-1/2 -translate-x-1/2 w-auto h-full object-cover aspect-[9/16]";
      el.appendChild(imgOverlay);

      // 📸 3️⃣ Capture seluruh area pakai snapdom
      const result = await snapdom(captureRef.current, {
        embedFonts: true,
      });
      const imgResult = await result.toPng();

      setSaveCoords(coords);
      setSaveAddress(address);
      setSaveTime(time);

      // 💾 Simpan ke state
      setPhoto(imgResult.src);

      // 🧹 4️⃣ Hapus overlay setelah selesai
      el.removeChild(imgOverlay);

      if (id === "set") setIsDetailVisible(true);
    } catch (err) {
      console.error("snapdom error:", err);
      setError("Gagal mengambil gambar.");
    }
  };

  // Ganti kamera depan/belakang
  const flipCamera = async () => {
    if (isFlipping) return;
    setIsFlipping(true);
    stopCamera();
    setVideoKey((v) => v + 1);
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    setTimeout(() => startCamera(nextMode), 400);
    setTimeout(() => setIsFlipping(false), 800);
  };

  const reTakePhoto = () => {
    setSaveCoords(null);
    setSaveAddress(null);
    setPhoto(null);
  };

  const savePhoto = () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);

      if (!photo) {
        showAlert("warning", "Tidak ada foto untuk disimpan.");
        return;
      }

      const date = new Date()
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .replace(/ /g, "-");

      const dataFile = {
        fileImage: photo, //data:image/png;base64,iVBORw0KGgo...
        fileName: `${date}-${id.toUpperCase()}.png`,
        coords: `${saveCoords.lat},${saveCoords.lng}`,
        address: saveAddress,
        initData: id.toUpperCase(),
        time: `${saveTime.hours}:${saveTime.minutes}:${saveTime.seconds}`,
        name: parsedUser.name,
        nik: parsedUser.nik_cabang,
        departement: parsedUser.departement.toUpperCase(),
        cabang: parsedUser.alias,
      };

      fetchData(dataFile);
    }
  };

  const savePinLokasi = async (values) => {
    const cleanedSerial = values.serial.replace(/\s+/g, "").toUpperCase();

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);

      if (!photo) {
        showAlert("warning", "Tidak ada foto untuk disimpan.");
        return;
      }

      const newValues = {
        ...values,
        serial: cleanedSerial,
        username: parsedUser.username,
        name: parsedUser.name,
        cabang: parsedUser.alias,
        fileImage: photo, //data:image/png;base64,iVBORw0KGgo...
        fileName: `${cleanedSerial}.png`,
      };

      fetchLocation(newValues);
    }
  };

  const dateNow = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const videoStyle = {
    transformStyle: "preserve-3d",
    backfaceVisibility: "hidden",
    transform: isFlipping
      ? "rotateY(180deg)"
      : facingMode === "user"
      ? "scaleX(-1)"
      : "scaleX(1)",
    filter: `
      brightness(1.2)
      contrast(0.80)
      saturate(1.3)
      hue-rotate(0deg)
      drop-shadow(0 0 1px rgba(255,255,255,0.1))
    `,
    transition: "transform 0.6s ease, filter 0.4s ease",
  };

  // Jika tidak cocok, redirect ke /main
  useEffect(() => {
    if (!namaHalaman) {
      router.replace("/main");
    }
  }, [namaHalaman, router]);
  if (!namaHalaman) return null;

  // Load suara kamera dan timer
  useEffect(() => {
    const audio = new Audio(soundCamera);
    audio.preload = "auto";
    shutterAudioRef.current = audio;

    const updateTimer = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      setTime({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    detectLocation("once"); // ambil lokasi pertama kali
    const watchId = detectLocation("watch");

    startCamera(facingMode);
    scrollToBottom();

    return () => {
      // Bersihkan referensi saat komponen di-unmount
      shutterAudioRef.current = null;
      clearInterval(interval);
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (coords?.lat && coords?.lng) {
      getAddressFromCoords(coords.lat, coords.lng);
    }
  }, [coords]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPercent((v) => {
        const next = v + 5;
        return next > 150 ? -50 : next;
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [percent]);

  return (
    <div className="relative flex justify-center w-full h-full bg-black overflow-hidden">
      <div className="relative w-full h-full sm:aspect-[9/16] sm:w-auto overflow-hidden">
        {error && (
          <div className="bg-black absolute top-0 h-full w-full z-[1000] flex justify-center items-center text-white text-xs select-none">
            {error}
          </div>
        )}
        {isLoading && (
          <div className="bg-black/50 absolute top-0 h-full w-full z-[1000] flex flex-col gap-4 justify-center items-center text-white text-xs select-none">
            <div className="flex flex-col gap-2 justify-center items-center">
              <Spin percent={percent} className="spin-white" />
              <span>Sedang memproses data...</span>
            </div>
          </div>
        )}
        <div
          ref={captureRef}
          className={`relative w-full h-screen overflow-hidden text-white bg-black duration-200 ${
            cameraReady ? "blur-0 opacity-100" : "blur-sm opacity-30"
          }`}
        >
          {/* Video kamera */}
          <motion.video
            key={videoKey}
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute top-0 left-1/2 -translate-x-1/2 h-full object-cover aspect-[9/16] w-auto"
            style={videoStyle}
          />

          {/* Overlay mirip Timemark */}
          <div className="absolute bottom-25 w-3/4 left-4 font-sans select-none text-white z-10">
            {/* Header: Nama Halaman + Jam */}
            <div className="flex items-center">
              <div className="flex items-center mb-3 rounded-lg px-2 py-1 bg-white">
                <div
                  className={`px-3 py-1 rounded-md font-bold uppercase text-lg text-white ${
                    colorMap[id] || "bg-black"
                  }`}
                >
                  {namaHalaman}
                </div>
                {id !== "set" ? (
                  <Timer time={time} />
                ) : (
                  <div className="pl-3 pr-2 py-1 text-2xl font-bold text-black">
                    MESIN
                  </div>
                )}
              </div>
            </div>

            <div
              className={`w-full border-l-4 pl-2 pr-10 text-xs ${
                colorMapBorder[id] || "border-black"
              }`}
            >
              {/* Tanggal */}
              {id !== "set" && (
                <p className="text-[12pt] mb-1 font-semibold text-shadow-md">
                  {dateNow}
                </p>
              )}

              {/* Alamat */}
              <p className="leading-snug text-shadow-md">
                {locError
                  ? locError // jika ada error, tampilkan error
                  : address
                  ? address // jika address sudah ada dan tidak ada error, tampilkan address
                  : "Mendeteksi alamat..."}
              </p>

              {/* Koordinat */}
              {!locError && coords && (
                <p className="mt-1 text-shadow-md">
                  {coords.lat.toFixed(6)}°, {coords.lng.toFixed(6)}°
                </p>
              )}
            </div>
          </div>

          {/* Logo watermark */}
          <div className="absolute top-0 left-0 flex items-center w-full h-full z-10 transform text-xs select-none opacity-50 px-4">
            <Image
              src={logoWatermark}
              alt="Logo"
              width={500}
              height={500}
              priority
              className="w-full h-auto object-contain mb-30"
            />
          </div>
        </div>

        <div className="absolute grid grid-cols-3 gap-4 place-items-center items-end bottom-5 w-full text-xl text-white z-20">
          <button
            onClick={() => {
              stopCamera();
              router.back();
            }}
            className="flex items-center justify-center aspect-square w-15 cursor-pointer rounded-full bg-white/30 hover:bg-white/50 border-2 border-white"
          >
            <CloseOutlined />
          </button>
          <button
            onClick={takePhoto}
            className="relative top-2 w-20 h-20 flex items-center justify-center rounded-full text-3xl bg-red-600 hover:bg-red-700 active:scale-95 border-[6px] border-white/10 cursor-pointer text-white"
          >
            <CameraOutlined />
          </button>
          <button
            onClick={flipCamera}
            className="hidden flex items-center justify-center aspect-square w-15 cursor-pointer rounded-full bg-white/30 hover:bg-white/50 border-2 border-white"
          >
            <SwapOutlined />
          </button>
        </div>

        {/* Alert jika gagal lokasi */}
        {alertConfig.show && (
          <div className="fixed left-1/2 -translate-x-1/2 top-4 z-50">
            <Alert
              message={alertConfig.message}
              type={alertConfig.type}
              showIcon
              closable
              className="w-[350px] shadow-md"
            />
          </div>
        )}

        {/* Preview hasil foto */}
        {photo && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
            <img
              src={photo}
              alt="Preview"
              className="absolute top-0 left-1/2 -translate-x-1/2 w-auto h-full object-cover aspect-[9/16]"
            />
            {!isLoading && !alertConfig.show && !isDetailVisible && (
              <div className="absolute bottom-5 w-full grid grid-cols-2 place-items-center px-10 items-center text-xl text-white">
                <button
                  onClick={reTakePhoto}
                  className="flex items-center justify-center aspect-square w-15 cursor-pointer rounded-full bg-white/30 hover:bg-white/50 border-2 border-white"
                >
                  <ReloadOutlined />
                </button>
                <button
                  onClick={savePhoto}
                  className="flex items-center justify-center aspect-square w-15 cursor-pointer rounded-full bg-green-500/30 hover:bg-green-500/50 border-2 border-green-500 text-green-500"
                >
                  <CheckOutlined />
                </button>
              </div>
            )}
          </div>
        )}

        <BottomPopup
          open={isDetailVisible}
          onClose={() => {
            reTakePhoto();
            setIsDetailVisible(false);
          }}
          title="Set Lokasi Mesin"
          dragDistance={false}
        >
          <Form
            layout="vertical"
            onFinish={savePinLokasi}
            initialValues={{
              address: saveAddress,
              coords: `${saveCoords?.lat},${saveCoords?.lng}`,
            }}
          >
            <Form.Item
              label="Serial"
              name="serial"
              rules={[{ required: true, message: false }]}
              className="!mb-3"
            >
              <Input
                placeholder="Masukkan nomor serial mesin"
                className="!py-2"
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/\s+/g, "")
                    .toUpperCase();
                  e.target.value = value;
                }}
              />
            </Form.Item>

            <Form.Item
              label="Nama Pelanggan"
              name="cust_name"
              rules={[{ required: true, message: false }]}
              className="!mb-3"
            >
              <Input placeholder="Masukkan nama pelanggan" className="!py-2" />
            </Form.Item>
            <Form.Item
              label="Gedung"
              name="building"
              rules={[{ required: false, message: false }]}
              className="!mb-3"
            >
              <Input placeholder="Masukkan nama gedung" className="!py-2" />
            </Form.Item>

            <Form.Item
              label="Alamat"
              name="address"
              rules={[{ required: true, message: false }]}
              className="!mb-3"
            >
              <Input.TextArea placeholder="Masukkan alamat lengkap" rows={4} />
            </Form.Item>

            <Form.Item name="coords">
              <Input type="hidden" />
            </Form.Item>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  reTakePhoto();
                  setIsDetailVisible(false);
                }}
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </Form>
        </BottomPopup>
      </div>
    </div>
  );
}
