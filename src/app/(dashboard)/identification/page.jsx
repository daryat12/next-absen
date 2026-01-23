"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Empty, Popover, Tag, Alert } from "antd";
import {
  SearchOutlined,
  LoadingOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { default as RepairIcon } from "@mui/icons-material/Build";
import { default as AddIcon } from "@mui/icons-material/Add";
import { default as CopyIcon } from "@mui/icons-material/ContentCopy";
import BottomPopup from "@/components/BottomPopup";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

export default function identificationPage() {
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    show: false,
    type: "info",
    message: "",
  });
  const limit = 50;

  const contentRef = useRef(null);
  const router = useRouter();

  const showAlert = (type, message, duration = 5000) => {
    setAlertConfig({ show: true, type, message });
    setTimeout(
      () => setAlertConfig({ show: false, type: "", message: "" }),
      duration
    );
  };

  const handleCopy = async () => {
    const r = selectedRecord;

    const text = `
*DETAIL IDENTIFIKASI*
---------------------

*Tanggal Kasus*: ${dayjs(r.tgl_kasus).format("DD MMMM YYYY")}
*Teknisi*: ${r.teknisi}
*Mesin*: ${r.mesin}
*Tipe mesin*: ${r.tipe}
*Kode pelanggan*: ${r.kode_pelanggan || "─"}
*Nama pelanggan*: ${r.nama_pelanggan || "─"}
*Status service*: ${r.status_service || "Tidak diketahui"}

*Detai kerusakan*:
${r.detail_kerusakan}

*Detai perbaikan*:
${r.detail_perbaikan}

*Catatan / Analisa*:
${r.catatan_analisa}
`.trim();

    try {
      await navigator.clipboard.writeText(text);
      showAlert("success", "Detail berhasil disalin");
    } catch {
      showAlert("error", "Gagal menyalin");
    }
  };

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setHasSearched(false);
    }
  }, [query]);

  const fetchData = async ({ isLoadMore = false } = {}) => {
    if (query.trim().length < 3) return;
    if (loading || loadingMore) return;

    isLoadMore ? setLoadingMore(true) : setLoading(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CI_API_URL}/api/NextAbsen/getDataPerbaikan`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ci-Key": process.env.NEXT_PUBLIC_CI_KEY || "",
          },
          body: JSON.stringify({
            search: query,
            limit,
            offset: isLoadMore ? offset : 0,
          }),
        }
      );

      const result = await response.json();
      const newData = result.data || [];

      setResults((prev) => (isLoadMore ? [...prev, ...newData] : newData));

      setHasMore(newData.length === limit);

      if (isLoadMore) {
        setOffset((prev) => prev + limit);
      } else {
        setOffset(limit);
      }
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = async () => {
    if (query.trim().length < 3) return;

    setHasSearched(true);
    setResults([]);
    setOffset(0);
    setHasMore(true);

    fetchData();
  };

  const showDetail = (record) => {
    setSelectedRecord(record);
    setIsDetailVisible(true);
  };

  const handleRepair = () => {
    router.push("/repair");
  };

  return (
    <>
      <Popover content="Perbaikan baru" placement="left" zIndex={40}>
        <button
          onClick={handleRepair}
          className="fixed md:absolute right-6 bottom-6 z-30 flex justify-center items-center gap-2 w-14 h-14 aspect-square rounded-full bg-white border-[2px] border-gray-300 hover:border-blue-500 transition cursor-pointer shadow-lg"
        >
          <AddIcon className="text-xl !text-gray-500" />
        </button>
      </Popover>

      <div className="w-full fixed md:absolute top-0 py-5">
        {alertConfig.show && (
          <div className="w-full px-6 absolute top-4 z-50">
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

      <div className="w-full fixed md:absolute top-13 z-10 bg-white pt-5">
        <div className="w-full flex items-center gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="w-full flex h-12 mx-5 px-1 bg-white rounded-full overflow-hidden items-center border border-gray-300"
          >
            <input
              type="text"
              placeholder="Cek kerusakan mesin..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-grow pl-6 py-2 outline-none text-sm"
            />

            <button
              type="submit"
              className={`text-neutral-600 hover:text-blue-500 cursor-pointer transition ${
                query ? "px-4" : "pl-4 pr-6"
              }`}
            >
              <SearchOutlined />
            </button>

            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="pr-6 text-neutral-600 hover:text-blue-500 cursor-pointer transition"
              >
                {loading ? <LoadingOutlined /> : <CloseOutlined />}
              </button>
            )}
          </form>
        </div>
        {hasSearched && query.length >= 3 && results.length > 0 && (
          <span className="block text-xs font-semibold pt-4 pb-2 pl-6 pr-4">
            Hasil Identifikasi
          </span>
        )}
      </div>

      <div className="flex flex-col items-center h-full overflow-hidden bg-white">
        <div className="h-40" />
        <div className="w-full pb-4 flex-1 flex flex-col gap-3 overflow-hidden">
          {/* BELUM SUBMIT / QUERY BELUM VALID */}
          {(!hasSearched || query.length < 3) && (
            <Empty
              description="Silahkan cek kerusakan mesin. minimal 3 karakter untuk melakukan pengecekan."
              className="!mt-30 px-10 select-none"
            />
          )}

          {/* HASIL ADA */}
          {hasSearched && query.length >= 3 && results.length > 0 && (
            <div className="w-full bg-white pb-3 text-left select-none">
              <div
                className="max-h-[74vh] overflow-y-auto"
                onScroll={(e) => {
                  const { scrollTop, scrollHeight, clientHeight } =
                    e.currentTarget;

                  if (
                    scrollTop + clientHeight >= scrollHeight - 50 &&
                    hasMore &&
                    !loadingMore
                  ) {
                    fetchData({ isLoadMore: true });
                  }
                }}
              >
                <ul className="w-full text-sm mb-10">
                  {results.map((item, idx) => (
                    <li
                      key={idx}
                      onClick={() => showDetail(item)}
                      className="hover:bg-gray-100 cursor-pointer w-full"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col justify-center gap-1 ml-4 w-12 items-center">
                          <div className="bg-gray-200 p-1 flex justify-center items-center w-8 h-8 rounded-full">
                            <RepairIcon className="!h-5 !w-5" />
                          </div>
                        </div>

                        <div
                          className={`flex flex-1 items-center justify-between max-w-[83%] ml-2 py-5 pr-4 
                            ${
                              idx < results.length - 1 &&
                              "border-b border-gray-200"
                            }
                          `}
                        >
                          <div className="flex flex-col max-w-[97%]">
                            <span className="font-semibold truncate">
                              {item.detail_kerusakan.toUpperCase().trim()}
                            </span>

                            <span className="text-xs text-gray-400 truncate">
                              {item.mesin.trim()} {item.tipe.trim()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              {loadingMore && (
                <div className="flex justify-center py-4 text-gray-400">
                  <LoadingOutlined />
                </div>
              )}
            </div>
          )}

          {/* SUDAH SUBMIT TAPI HASIL KOSONG */}
          {hasSearched && query.length >= 3 && results.length === 0 && (
            <Empty
              description="Data yang anda cari tidak ditemukan."
              className="!mt-45 px-10 select-none"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </div>
      </div>

      <BottomPopup
        open={isDetailVisible}
        onClose={() => setIsDetailVisible(false)}
        title="Detail Identifikasi"
      >
        {selectedRecord && (
          <>
            <div
              ref={contentRef}
              className="space-y-4 text-sm mb-4 select-text"
            >
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="space-y-2">
                  <p>
                    <span className="inline-block w-30 font-semibold">
                      Tanggal Kasus
                    </span>
                    : {dayjs(selectedRecord.tgl_kasus).format("DD MMMM YYYY")}
                  </p>
                  <p>
                    <span className="inline-block w-30 font-semibold">
                      Teknisi
                    </span>
                    : {selectedRecord.teknisi}
                  </p>
                  <p>
                    <span className="inline-block w-30 font-semibold">
                      Mesin
                    </span>
                    : {selectedRecord.mesin}
                  </p>
                  <p>
                    <span className="inline-block w-30 font-semibold">
                      Tipe mesin
                    </span>
                    : {selectedRecord.tipe}
                  </p>
                  <p>
                    <span className="inline-block w-30 font-semibold">
                      Kode pelanggan
                    </span>
                    : {selectedRecord.kode_pelanggan || "─"}
                  </p>
                  <p>
                    <span className="inline-block w-30 font-semibold">
                      Nama pelanggan
                    </span>
                    : {selectedRecord.nama_pelanggan || "─"}
                  </p>
                  <p>
                    <span className="inline-block w-30 font-semibold">
                      Status service
                    </span>
                    :{" "}
                    {selectedRecord.status_service === "Selesai" ? (
                      <Tag color="green">Selesai</Tag>
                    ) : selectedRecord.status_service === "Tidak selesai" ? (
                      <Tag color="orange">Tidak selesai</Tag>
                    ) : (
                      <Tag color="default">Tidak diketahui</Tag>
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-semibold">Detai kerusakan:</h3>
                <p>{selectedRecord.detail_kerusakan}</p>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Detai perbaikan:</h3>
                <p>{selectedRecord.detail_perbaikan}</p>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold">Catatan / Analisa:</h3>
                <p>{selectedRecord.catatan_analisa}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-8">
              <button
                type="button"
                onClick={handleCopy}
                className="flex gap-2 justify-center items-center w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 active:bg-gray-300 active:scale-95 rounded-md cursor-pointer"
              >
                <CopyIcon className="!h-4 !w-4" />
                Salin
              </button>
            </div>
          </>
        )}
      </BottomPopup>
    </>
  );
}
