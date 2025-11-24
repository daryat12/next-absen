"use client";

import React, { useEffect, useRef, useState } from "react";
import { Tag, Empty, Alert, Badge, Input, Popover, Modal } from "antd"; // ✅ Tambahkan Alert
import {
  EyeOutlined,
  DownloadOutlined,
  FilterOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import BottomPopup from "@/components/BottomPopup";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

function ImageActions({ imageUrl, description }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isImageValid, setIsImageValid] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleConfirm = () => {
    setIsModalOpen(false); // Tutup modal
    handleDownload(); // Lanjut download
  };

  return (
    <>
      {isImageValid && (
        <div className="flex gap-1">
          <div
            onClick={() => setPreviewOpen(true)}
            className="flex gap-1 items-center justify-center px-2 py-1 bg-white hover:bg-gray-200 border border-gray-300 rounded-md cursor-pointer"
          >
            <EyeOutlined /> <span className="text-[8pt]">Preview</span>
          </div>

          <div
            onClick={() => setIsModalOpen(true)}
            className="flex gap-1 items-center justify-center px-2 py-1 bg-white hover:bg-gray-200 border border-gray-300 rounded-md cursor-pointer"
          >
            <DownloadOutlined /> <span className="text-[8pt]">Download</span>
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
              className="max-w-[95vw] max-h-[95vh] object-contain select-none border-8 border-white rounded"
            />
          </div>
        </div>
      )}

      <Modal
        open={isModalOpen}
        title={<h1 className="text-2xl">Download</h1>}
        onCancel={() => setIsModalOpen(false)}
        footer={null} // custom footer
        className="text-center"
      >
        <p className="my-10">
          Apa anda ingin mendownload foto {description.toLowerCase()}. jika ya,
          silakan lanjutkan.
        </p>
        <div className="flex justify-center gap-3 mt-4">
          <button
            className="w-30 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 cursor-pointer"
            onClick={() => setIsModalOpen(false)}
          >
            Tidak
          </button>
          <button
            className="w-30 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 cursor-pointer"
            onClick={handleConfirm}
          >
            Lanjut
          </button>
        </div>
      </Modal>
    </>
  );
}

export default function ApprovalPage() {
  const [userClient, setUserClient] = useState({});
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
  });
  const [tempFilters, setTempFilters] = useState(filters);
  const [userAttendance, setUserAttendance] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const limit = 10;
  const [alertConfig, setAlertConfig] = useState({
    show: false,
    type: "info",
    message: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");
  const [selectedDeleteId, setSelectedDeleteId] = useState(null);

  const showAlert = (type, message, duration = 5000) => {
    setAlertConfig({ show: true, type, message });
    setTimeout(
      () => setAlertConfig({ show: false, type: "", message: "" }),
      duration
    );
  };

  const listRef = useRef(null);

  const statusMap = {
    H: "Hadir",
    T: "Telat",
    T1: "Telat 1",
    T2: "Telat 2",
  };

  const fetchData = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CI_API_URL}/api/NextAbsen/approveAbsen`,
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
        showAlert("success", result.message);
      } else {
        showAlert("danger", result.message || "Gagal menyimpan data!");
      }
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRemoveData = async (data) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CI_API_URL}/api/NextAbsen/removeAbsen`,
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
        showAlert("success", result.message);
      } else {
        showAlert("danger", result.message || "Gagal menghapus data!");
      }
    } catch (error) {
      console.error("Gagal menghapus data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAttendance = async (parsedUser, newOffset = 0, append = false) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CI_API_URL}/api/NextAbsen/getAllAttendance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ci-Key": process.env.NEXT_PUBLIC_CI_KEY || "",
          },
          body: JSON.stringify({
            group: parsedUser.group_name?.includes("Super Admin") || "",
            cabang: parsedUser.alias || "",
            dataTipe: "waiting",
            limit,
            offset: newOffset,
            filters,
          }),
        }
      );

      const result = await response.json();
      // Jika API mengembalikan status false, berhenti
      if (!result || !result.status) {
        if (!append) setUserAttendance([]);
        setHasMore(false);
        return;
      }

      const incoming = Array.isArray(result.data) ? result.data : [];

      if (append) {
        setUserAttendance((prev) => {
          const merged = [...prev, ...incoming];
          // hilangkan duplikat berdasarkan id
          const unique = merged.filter(
            (v, i, a) => a.findIndex((t) => t.id === v.id) === i
          );
          return unique;
        });
      } else {
        setUserAttendance(incoming);
      }

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
      setUserClient(parsedUser);
      setOffset(0);
      setHasMore(true);
      setUserAttendance([]);
      fetchAttendance(parsedUser, 0, false);
    }
  }, [filters]);

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
          fetchAttendance(parsedUser, offset, true);
        }
      }
    };

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [offset, hasMore, loading]);

  const data = (userAttendance || []).map((item) => {
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
    const cleanName = item.nama.replace(/\s*\([^)]*\)/g, "").trim();

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
            ? `${baseUrl}/${cleanName}-${item.cabang_alias}/${item.foto_scan_masuk}`
            : null,
        },
        locationOut: {
          address: item.lokasi_detail_keluar,
          lat: latKeluar,
          lng: lngKeluar,
          image: item.foto_scan_keluar
            ? `${baseUrl}/${cleanName}-${item.cabang_alias}/${item.foto_scan_keluar}`
            : null,
        },
      },
    };
  });

  const formatTime = (timeString) => {
    if (!timeString) return "─";
    const [hour, minute] = timeString.split(":");
    if (!hour || !minute) return "─";
    return `${hour}.${minute}`;
  };

  const showDetail = (record) => {
    setSelectedRecord(record);
    setIsDetailVisible(true);
  };

  const handleUpadate = (id) => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const payloadData = {
        id,
        username: parsedUser.username,
        name: parsedUser.name,
      };

      fetchData(payloadData);
    }
  };

  const handleDelete = (id) => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      const payloadData = {
        id,
        username: parsedUser.username,
      };

      fetchRemoveData(payloadData);
    }
  };

  const handleApprove = (id) => {
    handleUpadate(id);

    if (!isLoading) {
      setUserAttendance((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status_approved: "1" } : item
        )
      );

      setIsDetailVisible(false);
    }
  };

  const handleRemove = (record) => {
    if (!record) return;
    setSelectedDeleteId(record.id); // simpan id yang ingin dihapus
    setModalTitle(
      `Hapus data, ${record.name} pada tanggal ${dayjs(record.date).format(
        "DD/MM/YYYY"
      )}`
    );
    setModalDescription("Jika tetap ingin menghapus, silakan lanjutkan?");
    setIsModalOpen(true);
  };

  const handleConfirm = () => {
    if (selectedDeleteId) {
      handleDelete(selectedDeleteId); // hapus data setelah konfirmasi

      setUserAttendance((prev) =>
        prev.filter((item) => item.id !== selectedDeleteId)
      );

      setIsDetailVisible(false);
      setSelectedDeleteId(null);
    }

    setIsModalOpen(false);
  };

  const filteredData = data.filter((item) => {
    const matchName = item.name
      .toLowerCase()
      .includes(filters.name.toLowerCase());

    return matchName;
  });

  const waitingData = filteredData.filter((item) => item.status === "waiting");

  const isFilterActive = filters.name !== "";

  const resetFilter = () => {
    setTempFilters({
      name: "",
    });
  };

  const applyFilter = () => {
    setFilters(tempFilters);
    setIsFilterVisible(false);
  };

  const isSuperAdmin = userClient.group_name?.includes("Super Admin");

  return (
    <>
      {/* 🔹 Header Filter Bar */}
      <Popover content="Filter" placement="left" zIndex={40}>
        <button
          onClick={() => setIsFilterVisible(true)}
          className="fixed md:absolute right-6 bottom-6 z-30 flex justify-center items-center gap-2 w-14 h-14 aspect-square rounded-full bg-white border-[2px] border-gray-300 hover:border-blue-500 transition cursor-pointer shadow-lg"
        >
          <Badge dot={isFilterActive} offset={[-2, 3]}>
            <FilterOutlined className="text-xl !text-gray-500" />
          </Badge>
        </button>
      </Popover>

      <div className="flex flex-col items-center h-full overflow-hidden bg-gray-50">
        <div className="h-15" />

        <div
          ref={listRef}
          className="w-full py-4 px-6 flex-1 flex flex-col gap-3 overflow-y-auto"
        >
          {waitingData.length > 0 ? (
            waitingData.map((item) => (
              <div
                key={item.id}
                onClick={() => showDetail(item)}
                className="bg-white border border-gray-300 rounded-2xl p-4 cursor-pointer transition transform hover:border-blue-500 active:border-blue-500"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-base font-semibold text-blue-500">
                    {item.name}
                  </h2>
                  <Tag color="orange" className="!mr-0">
                    Waiting
                  </Tag>
                </div>
                <div className="flex items-center justify-between mt-2 text-sm text-gray-700">
                  <p className="text-gray-400">
                    {dayjs(item.date).format("dddd, DD MMMM YYYY")}
                  </p>
                </div>
              </div>
            ))
          ) : loading ? (
            <p className="text-center text-gray-500 mt-6">Memuat data...</p>
          ) : (
            <Empty
              description="Tidak ada data kehadiran yang menunggu persetujuan"
              className="mt-30"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>

        {/* 🔹 BottomPopup Detail Kehadiran */}
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
                        description="Masuk"
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
                        description="Pulang"
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

              <div className="flex flex-col gap-2 mt-8">
                {selectedRecord.status === "waiting" && (
                  <>
                    <button
                      onClick={() => handleApprove(selectedRecord.id)}
                      className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md cursor-pointer"
                    >
                      Approved
                    </button>

                    {isSuperAdmin && (
                      <button
                        onClick={() => handleRemove(selectedRecord)}
                        className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md cursor-pointer"
                      >
                        Hapus
                      </button>
                    )}
                  </>
                )}
                <button
                  onClick={() => setIsDetailVisible(false)}
                  className={`w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md cursor-pointer ${
                    selectedRecord.status === "waiting" ? "" : "mt-4"
                  }`}
                >
                  Tutup
                </button>
              </div>
            </div>
          )}
        </BottomPopup>

        {/* 🔹 BottomPopup Filter */}
        <BottomPopup
          open={isFilterVisible}
          onClose={() => setIsFilterVisible(false)}
          title="Filter Karyawan"
        >
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Nama</label>
              <Input
                placeholder="Cari nama karyawan"
                value={tempFilters.name}
                onChange={(e) =>
                  setTempFilters({ ...tempFilters, name: e.target.value })
                }
                className="h-10"
              />
            </div>

            <div className="flex justify-between pt-4">
              <button
                onClick={() => resetFilter()}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md cursor-pointer"
              >
                Reset
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsFilterVisible(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md  cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={applyFilter}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md  cursor-pointer"
                >
                  Terapkan
                </button>
              </div>
            </div>
          </div>
        </BottomPopup>
      </div>

      {/* ✅ Alert sukses */}
      <div className="w-full fixed md:absolute top-12 py-5">
        {alertConfig.show && (
          <div className="w-full px-6 absolute top-6 z-20">
            <Alert
              message={alertConfig.message}
              type={alertConfig.type}
              showIcon
              closable
              className="mb-4 rounded-lg"
            />
          </div>
        )}
      </div>

      <Modal
        open={isModalOpen}
        title={<h1 className="text-2xl">Peringatan!</h1>}
        onCancel={() => setIsModalOpen(false)}
        footer={null} // custom footer
        className="text-center"
      >
        <p className="my-10">
          <strong className="text-red-500 text-[13.2pt]">{modalTitle}</strong>
          <br />
          {modalDescription}
        </p>
        <div className="flex justify-center gap-3 mt-4">
          <button
            className="w-30 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 cursor-pointer"
            onClick={() => setIsModalOpen(false)}
          >
            Tidak
          </button>
          <button
            className="w-30 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500 cursor-pointer"
            onClick={handleConfirm}
          >
            Lanjut
          </button>
        </div>
      </Modal>
    </>
  );
}
