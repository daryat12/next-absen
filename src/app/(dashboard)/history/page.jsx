"use client";

import React, { useEffect, useRef, useState } from "react";
import { Tag, DatePicker, Empty } from "antd";
import {
  EyeOutlined,
  DownloadOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import BottomPopup from "@/components/BottomPopup";
import locale from "antd/es/date-picker/locale/id_ID";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

function ImageActions({ imageUrl }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isImageValid, setIsImageValid] = useState(false);

  useEffect(() => {
    if (!imageUrl) {
      setIsImageValid(false);
      return;
    }

    const img = new Image();
    img.onload = () => setIsImageValid(true);
    img.onerror = () => setIsImageValid(false);
    img.src = imageUrl;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  const handleDownload = async () => {
    if (!imageUrl) return;
    try {
      const res = await fetch(imageUrl, { mode: "cors" });
      if (!res.ok) throw new Error("Gagal mengambil file");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = (imageUrl.split("/").pop() || "file").split("?")[0];
      link.href = url;
      link.download = filename;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      window.open(imageUrl, "_blank", "noopener");
    }
  };

  return (
    <>
      {isImageValid && (
        <div className="flex gap-1">
          <div
            onClick={() => setPreviewOpen(true)}
            className="flex items-center justify-center aspect-square w-7 bg-white hover:bg-gray-200 border border-gray-300 rounded-md cursor-pointer"
          >
            <EyeOutlined />
          </div>

          <div
            onClick={handleDownload}
            className="flex items-center justify-center aspect-square w-7 bg-white hover:bg-gray-200 border border-gray-300 rounded-md cursor-pointer"
          >
            <DownloadOutlined />
          </div>
        </div>
      )}

      {previewOpen && (
        <div
          onClick={() => setPreviewOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <div className="relative">
            {/* Tombol close di pojok kanan atas foto */}
            <div
              onClick={() => setPreviewOpen(false)}
              className="absolute -top-3 -right-3 flex items-center justify-center bg-white h-8 w-8 rounded-full shadow cursor-pointer"
            >
              <CloseOutlined />
            </div>

            {/* Gambar */}
            <img
              src={imageUrl}
              alt="Preview"
              onClick={(e) => e.stopPropagation()}
              className="max-w-[85vw] max-h-[85vh] object-contain select-none border-8 border-white rounded"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default function HistoryPage() {
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [tanggal, setTanggal] = useState(dayjs());
  const [userHistory, setUserHistory] = useState([]); // array of raw items from API
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 10;

  const listRef = useRef(null);

  const statusMap = {
    H: "Hadir",
    T: "Telat",
    T1: "Telat 1",
    T2: "Telat 2",
  };

  const fetchHistory = async (parsedUser, newOffset = 0, append = false) => {
    if (!parsedUser) return;
    try {
      setLoading(true);
      const tanggalPayload = tanggal ? dayjs(tanggal).format("YYYY-MM") : "";

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CI_API_URL}/api/NextAbsen/getHistory`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ci-Key": process.env.NEXT_PUBLIC_CI_KEY || "",
          },
          body: JSON.stringify({
            nik: parsedUser.nik,
            tanggal: tanggalPayload,
            dataTipe: "history",
            limit,
            offset: newOffset,
          }),
        }
      );

      const result = await response.json();
      // Jika API mengembalikan status false, berhenti
      if (!result || !result.status) {
        if (!append) setUserHistory([]);
        setHasMore(false);
        return;
      }

      const incoming = Array.isArray(result.data) ? result.data : [];

      if (append) {
        setUserHistory((prev) => {
          const merged = [...prev, ...incoming];
          // hilangkan duplikat berdasarkan id
          const unique = merged.filter(
            (v, i, a) => a.findIndex((t) => t.id === v.id) === i
          );
          return unique;
        });
      } else {
        setUserHistory(incoming);
      }

      // update offset berdasarkan jumlah data yang benar-benar diterima
      setOffset((prev) => newOffset + incoming.length);
      setHasMore(incoming.length >= limit);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setOffset(0);
      setHasMore(true);
      setUserHistory([]);
      fetchHistory(parsedUser, 0, false);
    }
  }, [tanggal]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onScroll = () => {
      if (loading || !hasMore) return;
      const threshold = 200; // px from bottom to trigger
      if (el.scrollHeight - el.scrollTop - el.clientHeight < threshold) {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          fetchHistory(parsedUser, offset, true);
        }
      }
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [offset, hasMore, loading]);

  const data = (userHistory || []).map((item) => {
    // Pisahkan koordinat jadi lat dan lng
    const [latMasuk, lngMasuk] = item.koordinat_masuk
      ? item.koordinat_masuk.split(",").map((v) => parseFloat(v))
      : [null, null];

    const [latKeluar, lngKeluar] = item.koordinat_keluar
      ? item.koordinat_keluar.split(",").map((v) => parseFloat(v))
      : [null, null];

    // Hitung total jam kerja
    const totalHours = (() => {
      if (!item.scan_masuk || !item.scan_keluar) return "─";
      const [inH, inM] = item.scan_masuk.split(":").map(Number);
      const [outH, outM] = item.scan_keluar.split(":").map(Number);
      const diffMinutes = outH * 60 + outM - (inH * 60 + inM);

      if (diffMinutes < 0) return "─";

      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours} jam ${minutes} menit`;
    })();

    const baseUrl = `${process.env.NEXT_PUBLIC_BASE_API_URL}/public/absensi`;

    return {
      id: item.id,
      date: item.tanggal,
      name: item.nama,
      checkIn: item.scan_masuk,
      checkOut: item.scan_keluar,
      status:
        item.status_approved === null || item.status_approved === "0"
          ? "waiting"
          : "approved",
      detail: {
        totalHours,
        attendanceStatus: statusMap[item.status_absen] || "Tidak Diketahui",
        locationIn: {
          address: item.lokasi_detail_masuk,
          lat: latMasuk,
          lng: lngMasuk,
          image: item.foto_scan_masuk
            ? `${baseUrl}/${item.nama}-${item.cabang_alias}/${item.foto_scan_masuk}`
            : null,
        },
        locationOut: {
          address: item.lokasi_detail_keluar,
          lat: latKeluar,
          lng: lngKeluar,
          image: item.foto_scan_keluar
            ? `${baseUrl}/${item.nama}-${item.cabang_alias}/${item.foto_scan_keluar}`
            : null,
        },
      },
    };
  });

  const filteredData = data.filter((item) =>
    dayjs(item.date).isSame(tanggal, "month")
  );

  const formatTime = (timeString) => {
    if (!timeString) return "─";
    const [hour, minute] = timeString.split(":");
    if (!hour || !minute) return "─";
    return `${hour}.${minute}`;
  };

  const handleChangeDate = (date) => setTanggal(date || dayjs());
  const showDetail = (record) => {
    setSelectedRecord(record);
    setIsDetailVisible(true);
  };

  return (
    <>
      <div className="w-full fixed md:absolute top-12 z-10 bg-gray-50 py-5">
        <div className="mt-2 px-6 w-full flex items-center gap-3">
          <DatePicker
            locale={locale}
            value={tanggal}
            onChange={handleChangeDate}
            format="MMMM YYYY"
            className="flex-1 h-12 !rounded-lg"
            placeholder="Pilih tanggal"
            picker="month"
          />
        </div>
      </div>

      <div className="flex flex-col items-center h-full overflow-hidden bg-gray-50">
        <div className="h-35" />

        {/* scrollable list container -> attach ref here */}
        <div
          ref={listRef}
          className="w-full py-4 px-6 flex-1 flex flex-col gap-3 overflow-y-auto"
        >
          {filteredData.length > 0 ? (
            filteredData.map((item) => (
              <div
                key={item.id}
                onClick={() => showDetail(item)}
                className="bg-white border border-gray-300 rounded-2xl p-4 cursor-pointer transition transform hover:border-blue-500 active:border-blue-500"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-semibold text-blue-500">
                    {item.name}
                  </h2>
                  {item.status === "approved" ? (
                    <Tag color="green" className="!mr-0">
                      Approved
                    </Tag>
                  ) : (
                    <Tag color="orange" className="!mr-0">
                      Waiting
                    </Tag>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {dayjs(item.date).format("dddd, DD MMMM YYYY")}
                </p>
                <div className="flex items-center justify-between mt-2 text-sm text-gray-700">
                  <p>
                    <strong>Masuk:</strong> {formatTime(item.checkIn)}
                  </p>
                  <p>
                    <strong>Pulang:</strong> {formatTime(item.checkOut)}
                  </p>
                </div>
              </div>
            ))
          ) : loading ? (
            <p className="text-center text-gray-500 mt-6">Memuat data...</p>
          ) : (
            <Empty
              description="Tidak ada data kehadiran di bulan ini"
              className="mt-30"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}

          {/* bottom indicators */}
          {loading && filteredData.length > 0 && (
            <p className="text-center text-gray-500 mt-2">Memuat lebih...</p>
          )}
        </div>

        <BottomPopup
          open={isDetailVisible}
          onClose={() => setIsDetailVisible(false)}
          title="Detail Kehadiran"
        >
          {selectedRecord && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="space-y-2">
                  <p>
                    <span className="inline-block w-25">Nama</span>:{" "}
                    <strong>{selectedRecord.name}</strong>
                  </p>
                  <p>
                    <span className="inline-block w-25">Tanggal</span>:{" "}
                    {dayjs(selectedRecord.date).format("dddd, DD MMMM YYYY")}
                  </p>
                  <div className="flex justify-between items-center">
                    <p>
                      <span className="inline-block w-25">Masuk</span>:{" "}
                      {formatTime(selectedRecord.checkIn)}
                    </p>
                    {selectedRecord.checkIn && (
                      <ImageActions
                        imageUrl={selectedRecord.detail.locationIn.image}
                      />
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p>
                      <span className="inline-block w-25">Pulang</span>:{" "}
                      {formatTime(selectedRecord.checkOut)}
                    </p>
                    {selectedRecord.checkOut && (
                      <ImageActions
                        imageUrl={selectedRecord.detail.locationOut.image}
                      />
                    )}
                  </div>
                  <p>
                    <span className="inline-block w-25">Total Jam</span>:{" "}
                    {selectedRecord.detail.totalHours}
                  </p>
                  <p>
                    <span className="inline-block w-25">Status Absen</span>:{" "}
                    {selectedRecord.detail.attendanceStatus}
                  </p>
                  <p>
                    <span className="inline-block w-25">Status</span>:{" "}
                    {selectedRecord.status === "approved" ? (
                      <Tag color="green">Approved</Tag>
                    ) : (
                      <Tag color="orange">Waiting</Tag>
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Lokasi Masuk:</h3>
                <p>{selectedRecord.detail.locationIn.address || "─"}</p>
                {selectedRecord.detail.locationIn.lat &&
                  selectedRecord.detail.locationIn.lng && (
                    <iframe
                      title="Lokasi Masuk"
                      src={`https://www.google.com/maps?q=${selectedRecord.detail.locationIn.lat},${selectedRecord.detail.locationIn.lng}&hl=id&z=17&output=embed`}
                      className="w-full h-56 rounded-lg border border-gray-300"
                      allowFullScreen
                    ></iframe>
                  )}
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Lokasi Pulang:</h3>
                <p>{selectedRecord.detail.locationOut.address || "─"}</p>
                {selectedRecord.detail.locationOut.lat &&
                  selectedRecord.detail.locationOut.lng && (
                    <iframe
                      title="Lokasi Pulang"
                      src={`https://www.google.com/maps?q=${selectedRecord.detail.locationOut.lat},${selectedRecord.detail.locationOut.lng}&hl=id&z=17&output=embed`}
                      className="w-full h-56 rounded-lg border border-gray-300"
                      allowFullScreen
                    ></iframe>
                  )}
              </div>

              <button
                onClick={() => setIsDetailVisible(false)}
                className="w-full mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md  cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}
        </BottomPopup>
      </div>
    </>
  );
}
