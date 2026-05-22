"use client";

import React, { useEffect, useRef, useState } from "react";
import { Form, Select, Tag, Empty, Alert, Badge, Input, Popover, Modal } from "antd"; // ✅ Tambahkan Alert
import {
    FilterOutlined,
} from "@ant-design/icons";
import BottomPopup from "@/components/BottomPopup";
import dayjs from "dayjs";
import "dayjs/locale/id";

const { TextArea } = Input;

dayjs.locale("id");
const { Option } = Select;

export default function TiketPage() {
    const [form] = Form.useForm();
    const [refreshSelesai, setRefreshSelesai] = useState(false);
    const [refreshReject, setRefreshReject] = useState(false);
    const [refreshMulai, setRefreshMulai] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [isDetailVisible, setIsDetailVisible] = useState(false);
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [isEditVisible, setIsEditVisible] = useState(false);
    const [filters, setFilters] = useState({
        nama_pelanggan: "",
    });
    const [tempFilters, setTempFilters] = useState(filters);
    const [userTiket, setUserTiket] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const limit = 50;
    const [alertConfig, setAlertConfig] = useState({
        show: false,
        type: "info",
        message: "",
    });

    const scrollRef = useRef(null);

    const showAlert = (type, message, duration = 5000) => {
        setAlertConfig({ show: true, type, message });
        setTimeout(
            () => setAlertConfig({ show: false, type: "", message: "" }),
            duration
        );
    };

    const STORAGE_KEY = "update_tiket_teknisi";

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);


            setTimeout(() => {
                form.setFieldsValue({
                    ...parsed,
                });
            }, 0);
        }
    }, [form]);

    const listRef = useRef(null);

    const disableBack = () => {
        window.onpopstate = function () {
            return false;
        };
    };

    const scrollToTop = () => {
        scrollRef.current?.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const enableBack = () => {
        window.onpopstate = null;
    };

    const fetchWithTimeout = (url, options = {}, timeout = 20000) => {
        return Promise.race([
            fetch(url, options),
            new Promise((_, reject) => setTimeout(() => reject("timeout"), timeout)),
        ]);
    };


    const fetchDataSelesai = async (data) => {
        setIsLoading(true);
        disableBack();
        try {
            const response = await fetchWithTimeout(
                `${process.env.NEXT_PUBLIC_CI_API_URL}/api/NextAbsen/UPDT_Tiket_Selesai`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "ci-Key": process.env.NEXT_PUBLIC_CI_KEY || "",
                    },
                    body: JSON.stringify(data),
                },
                30000
            );

            const result = await response.json();

            if (result?.status === true || result?.status === "true" || result?.status == 1) {
                showAlert("success", result.message);
                setIsEditVisible(false);
                localStorage.removeItem(STORAGE_KEY);
                setRefreshSelesai(true);
            } else {
                showAlert("error", result.message || "Gagal menyimpan data!");
            }
        } catch (error) {
            if (error === "timeout") {
                showAlert(
                    "error",
                    "Server terlalu lama merespon (lebih dari 30 detik)!"
                );
            } else {
                showAlert("error", "Gagal menyimpan data!");
            }
        } finally {
            scrollToTop();
            setIsLoading(false);
            enableBack();
        }
    };
    const fetchDataReject = async (data) => {
        setIsLoading(true);
        disableBack();
        try {
            const response = await fetchWithTimeout(
                `${process.env.NEXT_PUBLIC_CI_API_URL}/api/NextAbsen/UPDT_Tiket_Reject`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "ci-Key": process.env.NEXT_PUBLIC_CI_KEY || "",
                    },
                    body: JSON.stringify(data),
                },
                30000
            );

            const result = await response.json();

            if (result?.status === true || result?.status === "true" || result?.status == 1) {
                // form.resetFields();
                localStorage.removeItem(STORAGE_KEY);
                showAlert("success", result.message);
                setRefreshReject(true);
            } else {
                showAlert("error", result.message || "Gagal menyimpan data!");
            }
        } catch (error) {
            if (error === "timeout") {
                showAlert(
                    "error",
                    "Server terlalu lama merespon (lebih dari 30 detik)!"
                );
            } else {
                showAlert("error", "Gagal menyimpan data!");
            }
        } finally {
            scrollToTop();
            setIsLoading(false);
            enableBack();
        }
    };

    const fetchDataMulai = async (data) => {
        setIsLoading(true);
        disableBack();
        try {
            const response = await fetchWithTimeout(
                `${process.env.NEXT_PUBLIC_CI_API_URL}/api/NextAbsen/UPDT_Tiket_Mulai`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "ci-Key": process.env.NEXT_PUBLIC_CI_KEY || "",
                    },
                    body: JSON.stringify(data),
                },
                30000
            );

            const result = await response.json();

            if (result?.status === true || result?.status === "true" || result?.status == 1) {
                // form.resetFields();
                localStorage.removeItem(STORAGE_KEY);
                showAlert("success", result.message);
                setRefreshMulai(true);
            } else {
                showAlert("error", result.message || "Gagal menyimpan data!");
            }
        } catch (error) {
            if (error === "timeout") {
                showAlert(
                    "error",
                    "Server terlalu lama merespon (lebih dari 30 detik)!"
                );
            } else {
                showAlert("error", "Gagal menyimpan data!");
            }
        } finally {
            scrollToTop();
            setIsLoading(false);
            enableBack();
        }
    };

    const fetchAllTiket = async (parsedUser, newOffset = 0, append = false) => {
        try {
            setLoading(true);
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_CI_API_URL}/api/NextAbsen/getAllTiket`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "ci-Key": process.env.NEXT_PUBLIC_CI_KEY || "",
                    },
                    body: JSON.stringify({
                        username: parsedUser.username || "",
                        cabang: parsedUser.alias || "",
                        limit,
                        offset: newOffset,
                        filters,
                    }),
                }
            );

            const result = await response.json();

            // Jika API mengembalikan status false, berhenti
            if (!result || !result.status) {
                if (!append) setUserTiket([]);
                setHasMore(false);
                return;
            }

            const incoming = Array.isArray(result.data) ? result.data : [];

            if (append) {
                setUserTiket((prev) => {
                    const merged = [...prev, ...incoming];
                    // hilangkan duplikat berdasarkan id
                    const unique = merged.filter(
                        (v, i, a) => a.findIndex((t) => t.ic_id === v.ic_id) === i
                    );
                    return unique;
                });
            } else {
                setUserTiket(incoming);
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
            setOffset(0);
            setHasMore(true);
            setUserTiket([]);
            fetchAllTiket(parsedUser, 0, false);
        }
    }, [filters, refreshMulai, refreshReject, refreshSelesai]);

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
                    fetchAllTiket(parsedUser, offset, true);
                }
            }
        };

        el.addEventListener("scroll", onScroll);
        return () => el.removeEventListener("scroll", onScroll);
    }, [offset, hasMore, loading]);

    const data = userTiket;

    const formatTime = (timeString) => {
        if (!timeString) return "─";
        const [hour, minute] = timeString.split(":");
        if (!hour || !minute) return "─";
        return `${hour}.${minute}`;
    };

    const showDetail = (record) => {
        const no_tiket_detail = 'TIKET #' + record.no_tiket;

        setSelectedRecord({
            ...record,
            no_tiket_detail
        });

        setIsDetailVisible(true);
    };

    const handleUpadateReject = (ic_id) => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            const payloadData = {
                ic_id,
                username: parsedUser.username,
                name: parsedUser.name,
                cabang: parsedUser.alias,
            };
            setRefreshReject(false);

            fetchDataReject(payloadData);
        }
    };

    const handleUpadateMulai = (ic_id) => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            const payloadData = {
                ic_id,
                username: parsedUser.username,
                name: parsedUser.name,
                cabang: parsedUser.alias,
            };
            setRefreshMulai(false);

            fetchDataMulai(payloadData);
        }
    };

    const handleReject = (ic_id) => {
        handleUpadateReject(ic_id);

        if (!isLoading) {
            setUserTiket((prev) =>
                prev.map((item) =>
                    item.ic_id === ic_id ? { ...item } : item
                )
            );

            setIsDetailVisible(false);
        }
    };


    const handleMulai = (ic_id) => {
        handleUpadateMulai(ic_id);

        if (!isLoading) {
            setUserTiket((prev) =>
                prev.map((item) =>
                    item.ic_id === ic_id ? { ...item } : item
                )
            );

            setIsDetailVisible(false);
        }
    };

    const handleSelesaiPopUp = (ic_id) => {
        form.resetFields();
        setIsEditVisible(true);
        setIsDetailVisible(false);
    }

    const filteredData = data.filter((item) => {

        const matchName = item.nama_pelanggan
            .toLowerCase()
            .includes(filters.nama_pelanggan.toLowerCase());
        return matchName;
    });

    const isFilterActive = filters.nama_pelanggan !== "";

    const resetFilter = () => {
        const resetData = {
            nama_pelanggan: "",
        };

        setTempFilters(resetData);
        setFilters(resetData);

        setIsFilterVisible(false);
    };

    const applyFilter = () => {
        setFilters(tempFilters);
        setIsFilterVisible(false);
    };

    const tipeTiket = (record) => {
        let result = '';
        let text = record.tipe;

        let replace = text
            .replace(/\bS\b/g, "CR Mesin")
            .replace(/\bT\b/g, "Toner")
            .replace(/\bIM\b/g, "Install Mesin")
            .replace(/\bIFP\b/g, "Install Free PC")
            .replace(/\bIAP\b/g, "Install Add PC")
            .replace(/\bIN\b/g, "Internal Issue")
            .replace(/\bEX\b/g, "External Issue")
            .replace(/\bSDK\b/g, "Sidak")
            .replace(/\bL\b/g, "Lain-lain");

        let result_arr = replace.split(", ");

        for (let i = 0; i < result_arr.length; i++) {
            result += result_arr[i] + ', ';
        }

        result = result.slice(0, -2);

        let new_res = '';

        if (result === 'CR MesinDK') {
            new_res = 'Sidak';
        } else {
            new_res = result;
        }

        return new_res;

    }

    const formatTanggalJam = (record) => {
        if (!record?.tgl) return "";

        const dt = new Date(record.tgl);

        const tanggal = dt.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });

        return `${tanggal} ${record.jam || ""}`;
    };

    const formatTargetTiket = (record) => {
        let dt = new Date(record.tgl);

        let jam = parseInt(record.jam.substring(0, 2), 10);
        const storedUser = localStorage.getItem("user");

        const parsedUser = JSON.parse(storedUser);
        let nama_pt = parsedUser.nama_pt;

        let target_jam =
            nama_pt === "PT. RDN ARTHA GRAFIKA" ? 4 :
                nama_pt === "PT. RDN ARTHA SENTOSA" ? 3 : 0;

        let set_tgl = "";
        let set_jam = "";

        if (jam >= 13) {
            // ===== SETELAH JAM 13.00 =====
            let total_jam = jam + target_jam;

            if (total_jam >= 17) {
                dt.setDate(dt.getDate() + 1);

                let day = dt.getDay();
                if (day === 6) dt.setDate(dt.getDate() + 2); // Sat
                if (day === 0) dt.setDate(dt.getDate() + 1); // Sun

                const d = String(dt.getDate()).padStart(2, "0");
                const m = String(dt.getMonth() + 1).padStart(2, "0");
                const y = dt.getFullYear();

                set_tgl = `${d}/${m}/${y}`;

                let sisa_jam = total_jam - 17;
                let nex_jam = 8 + sisa_jam;

                set_jam = String(nex_jam).padStart(2, "0");
            } else {
                const d = String(dt.getDate()).padStart(2, "0");
                const m = String(dt.getMonth() + 1).padStart(2, "0");
                const y = dt.getFullYear();

                set_tgl = `${d}/${m}/${y}`;
                set_jam = String(total_jam).padStart(2, "0");
            }

        } else {
            // ===== SEBELUM JAM 13.00 =====
            const nex_jam = (() => {
                let next = jam + target_jam;

                if (jam < 12 && next >= 12) {
                    next += 1; // jam istirahat
                }

                return next;
            })();

            const d = String(dt.getDate()).padStart(2, "0");
            const m = String(dt.getMonth() + 1).padStart(2, "0");
            const y = dt.getFullYear();

            set_tgl = `${d}/${m}/${y}`;
            set_jam = String(nex_jam).padStart(2, "0");
        }

        return `${set_tgl} ${set_jam}${record.jam.substring(2)}`;
    };

    const handleSelesai = (val) => {

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);

            const payload = {
                ...val,
                ic_id: selectedRecord.ic_id,
                ic_code: selectedRecord.ic_code,
                username: parsedUser.username,
                name: parsedUser.name,
                cabang: parsedUser.alias,
            };
            setRefreshSelesai(false);

            fetchDataSelesai(payload);
        }
    };

    const handleFinishFailed = () => {
        scrollToTop();
        showAlert("error", "Harap isi data dengan benar!");
    };

    // Reset
    const handleReset = () => {
        form.resetFields();
        localStorage.removeItem(STORAGE_KEY);
    };


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
                    {filteredData.length > 0 ? (
                        filteredData.map((item) => (
                            <div
                                key={item.ic_id}
                                onClick={() => showDetail(item)}
                                className={`${item?.jam_mulai_kerja === ''
                                    ? 'bg-white border-gray-300'
                                    : 'bg-sky-200 border-blue-500'
                                    } border  rounded-2xl p-4 cursor-pointer transition transform hover:border-blue-500 active:border-blue-500`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-base font-semibold text-slate-500">
                                        {item.kategori_}
                                    </h2>
                                    <Tag color="orange" className="!mr-0">
                                        {item.status}
                                    </Tag>
                                </div>
                                <div className="flex justify-center items-center py-2 border rounded mb-2 border-blue-500">
                                    <h2 className="text-base font-bold text-blue-500">TIKET # {item.no_tiket}</h2>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-base font-semibold text-slate-500">
                                        {item.cust_code}
                                    </h2>
                                    <h2 className="text-base font-semibold text-slate-500">
                                        {tipeTiket(item)}
                                    </h2>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-base font-semibold text-blue-500">
                                        {item.nama_pelanggan}
                                    </h2>
                                </div>
                                <div className="flex items-center justify-between mt-2 text-sm text-gray-700">
                                    <p className="text-gray-400">
                                        {dayjs(item.tgl).format("dddd, DD MMMM YYYY")}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : loading ? (
                        <p className="text-center text-gray-500 mt-6">Memuat data...</p>
                    ) : (
                        <Empty
                            description="Tidak ada data tiket"
                            className="!mt-30"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )}
                </div>

                {/* POPUP EDIT */}
                {selectedRecord && (
                    <BottomPopup
                        open={isEditVisible}
                        onClose={() => setIsEditVisible(false)}
                        title={selectedRecord.no_tiket_detail}
                    >

                        <Form
                            form={form}
                            layout="vertical"
                            className="w-full !space-y-4"
                            onFinish={handleSelesai}
                            onFinishFailed={handleFinishFailed}
                        >
                            <Form.Item
                                label="Tindakan Penyelesaian"
                                name="remark"
                                rules={[{ required: true, message: "" }]}
                            >
                                <TextArea rows={3} placeholder="Tindakan Penyelesaian" />
                            </Form.Item>

                            {/* BUTTON */}
                            <div className="flex justify-end gap-2 mt-8">
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 cursor-pointer"
                                >
                                    Reset
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
                )}
                {/*  END */}

                {/* 🔹 BottomPopup Detail Tiket */}
                {selectedRecord && (
                    <BottomPopup
                        open={isDetailVisible}
                        onClose={() => setIsDetailVisible(false)}
                        title={selectedRecord.no_tiket_detail}
                    >

                        <div className="space-y-4 text-sm">
                            <div className="grid grid-cols-1 gap-4 text-sm">
                                <div className="space-y-2">
                                    <p>
                                        <span className="inline-block w-39">Kategori</span>:{" "}
                                        <strong>{selectedRecord.kategori_}</strong>
                                    </p>
                                    <p>
                                        <span className="inline-block w-39">Tipe</span>:{" "}
                                        <strong>{tipeTiket(selectedRecord)}</strong>
                                    </p>
                                    <p>
                                        <span className="inline-block w-39">Status</span>:{" "}
                                        <Tag color="orange">{selectedRecord.status}</Tag>
                                    </p>
                                    <p>
                                        <span className="inline-block w-39">Kode Cust</span>:{" "}
                                        <strong>{selectedRecord.cust_code}</strong>
                                    </p>
                                    <p>
                                        <span className="inline-block w-39">Perusahaan</span>:{" "}
                                        <strong>{selectedRecord.nama_pelanggan}</strong>
                                    </p>
                                    <p>
                                        <span className="inline-block w-39">Alamat / Area</span>:{" "}
                                        <strong>{selectedRecord.alamat}</strong>
                                    </p>
                                    <p>
                                        <span className="inline-block w-39">S/N</span>:{" "}
                                        <strong>{selectedRecord.serial}</strong>
                                    </p>
                                    <p>
                                        <span className="inline-block w-39">Tipe Mesin</span>:{" "}
                                        <strong>{selectedRecord.tipe_mesin}</strong>
                                    </p>
                                    <p>
                                        <span className="inline-block w-39">Keluhan</span>:{" "}
                                        <strong>{selectedRecord.keluhan}</strong>
                                    </p>
                                    <p>
                                        <span className="inline-block w-39 align-middle">Waktu Panggilan</span>:{" "}
                                        <strong>{formatTanggalJam(selectedRecord)}</strong>
                                    </p>
                                    <p>
                                        <span className="inline-block w-39 align-middle">Target Maksimal Kunjungan</span>:{" "}
                                        <strong>{formatTargetTiket(selectedRecord)}</strong>
                                    </p>
                                    <p>
                                        <span className="inline-block w-39">User</span>:{" "}
                                        <strong>{selectedRecord.user_cust}</strong>
                                    </p>
                                    <p>
                                        <span className="inline-block w-39">Teknisi Area</span>:{" "}
                                        <strong>{selectedRecord.teknisi}</strong>
                                    </p>
                                    <p>
                                        <span className="inline-block w-39">Teknisi Asist</span>:{" "}
                                        <strong>{selectedRecord.teknisi_asist != '' ? selectedRecord.teknisi_asist : ' - '}</strong>
                                    </p>
                                    <p>
                                        <span className="inline-block w-39">Catatan Khusus</span>:{" "}
                                        <strong>{selectedRecord.catatan != '' ? selectedRecord.catatan : ' - '}</strong>
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 mt-8">
                                {selectedRecord?.jam_mulai_kerja === '' && (
                                    <button
                                        onClick={() => handleMulai(selectedRecord.ic_id)}
                                        className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md cursor-pointer"
                                    >
                                        Mulai
                                    </button>
                                )}
                                {selectedRecord?.jam_mulai_kerja != '' && (
                                    <button
                                        onClick={() => handleSelesaiPopUp(selectedRecord.ic_id)}
                                        className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md cursor-pointer"
                                    >
                                        Selesai
                                    </button>
                                )}
                                {selectedRecord?.jam_mulai_kerja === '' && (
                                    <button
                                        onClick={() => handleReject(selectedRecord.ic_id)}
                                        className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md cursor-pointer"
                                    >
                                        Reject
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsDetailVisible(false)}
                                    className={`w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md cursor-pointer mt-4"
                                        }`}
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </BottomPopup>
                )}

                {/* 🔹 BottomPopup Filter */}
                <BottomPopup
                    open={isFilterVisible}
                    onClose={() => setIsFilterVisible(false)}
                    title="Filter Karyawan"
                >
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            applyFilter();
                        }}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block font-medium mb-1">Nama Pelanggan</label>
                            <Input
                                placeholder="Cari nama pelanggan"
                                value={tempFilters.nama_pelanggan}
                                onChange={(e) =>
                                    setTempFilters({ ...tempFilters, nama_pelanggan: e.target.value })
                                }
                                className="h-10"
                            />
                        </div>

                        <div className="flex justify-between pt-4">
                            <button
                                type="button"
                                onClick={() => resetFilter()}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md cursor-pointer"
                            >
                                Reset
                            </button>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsFilterVisible(false)}
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
        </>
    );
}
