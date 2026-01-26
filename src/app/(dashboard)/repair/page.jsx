"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Select, DatePicker, Alert, Spin } from "antd";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Option } = Select;

export default function RepairPage() {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [percent, setPercent] = useState(-50);
  const [mesinValue, setMesinValue] = useState(null);
  const [alertConfig, setAlertConfig] = useState({
    show: false,
    type: "info",
    message: "",
  });

  const scrollRef = useRef(null);
  const router = useRouter();

  const showAlert = (type, message, duration = 5000) => {
    setAlertConfig({ show: true, type, message });
    setTimeout(
      () => setAlertConfig({ show: false, type: "", message: "" }),
      duration
    );
  };

  const STORAGE_KEY = "repair_form_draft";

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);

      form.setFieldsValue({
        ...parsed,
        tanggal_kasus: parsed.tanggal_kasus
          ? dayjs(parsed.tanggal_kasus)
          : null,
      });

      setMesinValue(parsed.mesin || null);
    }
  }, [form]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPercent((v) => {
        const next = v + 5;
        return next > 150 ? -50 : next;
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [percent]);

  const toUpperCaseValues = (values) => {
    const EXCLUDE = [
      "kerusakan",
      "catatan",
      "perbaikan",
      "mesin",
      "status_service",
    ];
    const result = {};
    Object.keys(values).forEach((key) => {
      const val = values[key];
      if (EXCLUDE.includes(key)) {
        result[key] = val;
      } else {
        result[key] = typeof val === "string" ? val.toUpperCase() : val;
      }
    });
    return result;
  };

  const handleIdentification = () => {
    router.push("/identification");
  };

  const fetchWithTimeout = (url, options = {}, timeout = 20000) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) => setTimeout(() => reject("timeout"), timeout)),
    ]);
  };

  const disableBack = () => {
    window.onpopstate = function () {
      return false;
    };
  };

  const enableBack = () => {
    window.onpopstate = null;
  };

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const fetchData = async (data) => {
    setIsLoading(true);
    disableBack();
    try {
      const response = await fetchWithTimeout(
        `${process.env.NEXT_PUBLIC_CI_API_URL}/api/NextAbsen/insPerbaikan`,
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

      if (result.status) {
        showAlert("success", result.message);

        localStorage.removeItem(STORAGE_KEY); // 🔥 hapus draft
        form.resetFields();
        setMesinValue(null);
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

  /* =========================
     SUBMIT
  ========================= */
  const handleValuesChange = (changedValues, allValues) => {
    const uppercased = toUpperCaseValues(changedValues);

    // update field yang berubah saja (biar cursor gak lompat)
    form.setFieldsValue(uppercased);

    const dataToSave = {
      ...allValues,
      ...uppercased,
      tanggal_kasus: allValues.tanggal_kasus
        ? allValues.tanggal_kasus.format("YYYY-MM-DD")
        : null,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  };

  const handleFinishFailed = () => {
    scrollToTop();
    showAlert("error", "Harap isi data dengan benar!");
  };

  const handleSubmit = (val) => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);

      const payload = {
        ...val,
        mesin: (val.mesin === "Lainnya"
          ? val.mesin_lainnya
          : val.mesin
        )?.toUpperCase(),
        tanggal_kasus: val.tanggal_kasus.format("YYYY-MM-DD"),
        username: parsedUser.username,
        name: parsedUser.name,
        cabang: parsedUser.alias,
      };

      fetchData(payload);
    }
  };

  /* =========================
     RESET
  ========================= */
  const handleReset = () => {
    form.resetFields();
    setMesinValue(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="flex flex-col items-center h-full overflow-hidden bg-white">
      {isLoading && (
        <div className="bg-black/50 absolute top-0 h-full w-full z-[1000] flex flex-col gap-4 justify-center items-center text-white text-xs select-none">
          <div className="flex flex-col gap-2 justify-center items-center">
            <Spin percent={percent} className="spin-white" />
            <span>Sedang memproses data...</span>
          </div>
        </div>
      )}
      <div className="h-20" />
      <div className="w-full fixed md:absolute top-12 py-5">
        {alertConfig.show && (
          <div className="w-full px-6 absolute top-6 z-50">
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
      <div ref={scrollRef} className="w-full pb-4 overflow-y-scroll">
        <p className="mb-4 text-xs border-b border-gray-200 py-4 px-8 bg-sky-500 text-white">
          Form ini dimaksudkan untuk pendataan perbaikan mesin dengan khasus
          yang jarang terjadi. Bertujuan untuk membantu teknisi lain yang
          mengalami hal serupa. Cek di menu{" "}
          <span
            onClick={handleIdentification}
            className="font-semibold underline cursor-pointer"
          >
            Identifikasi
          </span>
        </p>
        <div className="px-8">
          <Form
            form={form}
            layout="vertical"
            className="w-full !space-y-4"
            onFinish={handleSubmit}
            onFinishFailed={handleFinishFailed}
            onValuesChange={handleValuesChange}
          >
            {/* Tanggal Kasus */}
            <Form.Item
              label="Tanggal kasus"
              name="tanggal_kasus"
              rules={[{ required: true, message: "" }]}
            >
              <DatePicker
                placeholder="Pilih tanggal"
                format="DD/MM/YYYY"
                className="w-full"
              />
            </Form.Item>

            {/* Mesin */}
            <Form.Item
              label="Mesin"
              name="mesin"
              rules={[{ required: true, message: "" }]}
            >
              <Select
                placeholder="Pilih mesin"
                onChange={(value) => setMesinValue(value)}
              >
                <Option value="Canon">Canon</Option>
                <Option value="Kyocera">Kyocera</Option>
                <Option value="Sindoh">Sindoh</Option>
                <Option value="Lainnya">Lainnya</Option>
              </Select>
            </Form.Item>

            {/* Mesin Lainnya */}
            {mesinValue === "Lainnya" && (
              <Form.Item
                name="mesin_lainnya"
                rules={[{ required: true, message: "" }]}
              >
                <Input placeholder="Masukkan nama mesin" />
              </Form.Item>
            )}

            {/* Tipe Mesin */}
            <Form.Item
              label="Tipe mesin"
              name="tipe_mesin"
              rules={[{ required: true, message: "" }]}
            >
              <Input placeholder="Masukkan tipe mesin" />
            </Form.Item>

            {/* Kode Pelanggan */}
            <Form.Item
              label="Kode pelanggan"
              name="kode_pelanggan"
              rules={[
                {
                  pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/,
                  message: "",
                },
              ]}
            >
              <Input placeholder="Kode pelanggan" />
            </Form.Item>

            {/* Nama Pelanggan */}
            <Form.Item
              label="Nama pelanggan"
              name="nama_pelanggan"
              // rules={[{ required: true, message: "" }]}
            >
              <Input placeholder="Nama pelanggan" />
            </Form.Item>

            {/* Kerusakan */}
            <Form.Item
              label="Detail kerusakan"
              name="kerusakan"
              rules={[{ required: true, message: "" }]}
            >
              <TextArea rows={3} placeholder="Detail kerusakan" />
            </Form.Item>

            {/* Perbaikan */}
            <Form.Item
              label="Detail perbaikan"
              name="perbaikan"
              rules={[{ required: true, message: "" }]}
            >
              <TextArea rows={3} placeholder="Detail perbaikan" />
            </Form.Item>

            {/* Status Service */}
            <Form.Item label="Status service" name="status_service">
              <Select placeholder="Pilih status">
                <Option value="Selesai">Selesai</Option>
                <Option value="Tidak selesai">Tidak selesai</Option>
              </Select>
            </Form.Item>

            {/* Catatan */}
            <Form.Item
              label="Catatan / Analisa"
              name="catatan"
              rules={[{ required: true, message: "" }]}
            >
              <TextArea rows={3} placeholder="Catatan atau analisa teknisi" />
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
        </div>
      </div>
    </div>
  );
}
