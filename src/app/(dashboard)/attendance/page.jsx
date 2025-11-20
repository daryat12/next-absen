"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Divider, Empty, Modal } from "antd";
import { LoginOutlined, LogoutOutlined } from "@ant-design/icons";

function Timer() {
  const [time, setTime] = useState({ hours: "", minutes: "", seconds: "" });

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      setTime({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🕒 Ambil tanggal & hari saat ini
  const today = new Date();

  // Format nama hari (Senin, Selasa, dst.)
  const hari = today.toLocaleDateString("id-ID", { weekday: "long" });

  // Format tanggal lengkap (misal: 16 Oktober 2025)
  const tanggal = today.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col items-center justify-center text-white -mb-15">
      <div className="mt-11 mb-4">Absen Live</div>
      <div className="flex items-end font-semibold tracking-wide">
        <span className="text-5xl">
          {time.hours}.{time.minutes}
        </span>
        <span className="text-2xl">.{time.seconds}</span>
      </div>
      <div className="mt-5 flex gap-1">
        <p>{hari},</p>
        <p>{tanggal}</p>
      </div>
    </div>
  );
}

function Card({ userData }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalDescription, setModalDescription] = useState("");

  const buttons = [
    {
      name: "Check In",
      icon: <LoginOutlined />,
      style: "text-blue-500 hover:bg-blue-300 bg-blue-200",
      link: "/camera/in",
    },
    {
      name: "Check Out",
      icon: <LogoutOutlined />,
      style: "text-orange-500 hover:bg-orange-300 bg-orange-200",
      link: "/camera/out",
    },
  ];

  const handleButtonClick = (button) => {
    const isCheckIn = button.name === "Check In";
    const isCheckOut = button.name === "Check Out";

    const disabled = isCheckIn && userData?.scan_keluar;
    if (disabled) return;

    // ===========================
    // 1) Check In → sudah scan_masuk
    // ===========================
    if (isCheckIn && userData?.scan_masuk) {
      setModalTitle("Anda sudah melakukan Check In.");
      setModalDescription("Jika ingin mengulang, silakan lanjutkan?");
      setIsModalOpen(true);
      return;
    }

    // ===========================
    // 2) Check Out → tanpa scan_masuk
    // ===========================
    if (isCheckOut && !userData?.scan_masuk) {
      setModalTitle("Anda belum melakukan Check In.");
      setModalDescription("Jika sudah absen di kantor, silakan lanjutkan?");
      setIsModalOpen(true);
      return;
    }

    // ===========================
    // 3) Check Out → sudah scan_keluar
    // ===========================
    if (isCheckOut && userData?.scan_keluar) {
      setModalTitle("Anda sudah melakukan Check Out.");
      setModalDescription("Jika ingin mengulang, silakan lanjutkan?");
      setIsModalOpen(true);
      return;
    }

    router.push(button.link);
  };

  const handleConfirm = () => {
    setIsModalOpen(false);
    router.push("/camera/out");
  };

  return (
    <div className="bg-white rounded-xl relative top-20 shadow-md">
      <div className="flex justify-around p-4">
        <div className="text-center">
          <p>Start Time</p>
          <p className="text-4xl font-semibold">
            {userData?.scan_masuk ? userData.scan_masuk.replace(":", ".") : "─"}
          </p>
        </div>
        <div className="text-center">
          <p>End Time</p>
          <p className="text-4xl font-semibold">
            {userData?.scan_keluar
              ? userData.scan_keluar.replace(":", ".")
              : "─"}
          </p>
        </div>
      </div>
      <Divider className="!m-0 text-neutral-200" />
      <div className="flex gap-4 justify-between items-center p-4">
        {buttons.map((button, index) => {
          const isCheckIn = button.name === "Check In";
          const disabled = isCheckIn && userData?.scan_keluar;

          return (
            <div
              key={index}
              className={`flex items-center justify-center gap-2 w-full font-bold rounded-lg py-3 select-none cursor-pointer ${
                disabled
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : button.style
              }`}
              onClick={() => handleButtonClick(button)}
            >
              {button.icon}
              {button.name}
            </div>
          );
        })}
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
    </div>
  );
}

export default function AttendancePage() {
  const [userData, setUserData] = useState(null);
  const [userHistory, setUserHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Format tanggal ke gaya Indonesia
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "─";
    const [hour, minute] = timeString.split(":");
    if (!hour || !minute) return "─";
    return `${hour}.${minute}`;
  };

  const fetchData = async (parsedUser) => {
    try {
      const today = new Date().toISOString().split("T")[0]; // format YYYY-MM-DD
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CI_API_URL}/api/NextAbsen/getUserData`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ci-Key": process.env.NEXT_PUBLIC_CI_KEY || "",
          },
          body: JSON.stringify({
            nik: parsedUser.nik,
            tanggal: today,
          }),
        }
      );

      const result = await response.json();
      setUserData(result.data);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    }
  };

  const fetchHistory = async (parsedUser) => {
    if (!parsedUser) return;
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0]; // format YYYY-MM-DD
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
            tanggal: today,
            dataTipe: "last",
          }),
        }
      );

      const result = await response.json();
      setUserHistory(result.data);
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

      // Ambil data hanya jika user ada
      fetchData(parsedUser);
      fetchHistory(parsedUser);
    }
  }, []);

  return (
    <>
      <div className="relative flex flex-col justify-center w-full px-4 py-6 bg-[#12549a]">
        <div className="hidden absolute -top-[130%] -left-1/2 bg-gradient-to-tl from-blue-500 to-[#12549a] rounded-full aspect-square w-[50rem] h-auto"></div>
        <div className="relative z-10">
          <Timer />
          <Card userData={userData} />
        </div>
      </div>
      <div className="w-full p-6 mt-15">
        <div className="font-semibold mb-4">Absen Terakhir</div>
        {(userHistory || []).length > 0 ? (
          userHistory.map((recent, i) => (
            <div
              key={i}
              className="flex flex-col gap-[2px] border-b border-neutral-200 pb-3 mb-4"
            >
              <p className="font-bold text-blue-500">
                {formatDate(recent.tanggal)}
              </p>
              <div className="flex justify-between text-[10pt]">
                <p>Check In</p>
                <p>{formatTime(recent.scan_masuk)}</p>
              </div>
              <div className="flex justify-between text-[10pt]">
                <p>Check Out</p>
                <p>{formatTime(recent.scan_keluar)}</p>
              </div>
            </div>
          ))
        ) : loading ? (
          <p className="text-center text-gray-500 mt-6">Memuat data...</p>
        ) : (
          <Empty
            description="Tidak ada data kehadiran sebelumnya"
            className="mt-5"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </div>
    </>
  );
}
