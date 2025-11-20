"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Badge, Divider, Alert, Modal } from "antd";
import { useProfile } from "@/context/ProfileContext";
import {
  UserOutlined,
  BellFilled,
  FieldTimeOutlined,
  LoginOutlined,
  LogoutOutlined,
  GiftOutlined,
  DollarCircleOutlined,
  FileDoneOutlined,
  TeamOutlined,
  CheckOutlined,
  ToolOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import AddLocationAltOutlinedIcon from "@mui/icons-material/AddLocationAltOutlined";
import { NewspaperOutlined as NewsIcon } from "@mui/icons-material";

function Header({ user }) {
  const { setShowProfile } = useProfile();
  const [showAlert, setShowAlert] = useState(false);
  const [alertKey, setAlertKey] = useState(0);

  const handleClick = () => {
    setShowAlert(true);
    setAlertKey((prev) => prev + 1);
    setTimeout(() => setShowAlert(false), 5000);
  };

  return (
    <div className="flex justify-between mb-12 px-2">
      <div
        className="flex items-center gap-3 cursor-pointer select-none"
        onClick={() => setShowProfile(true)}
      >
        <Avatar
          className="!bg-white"
          size={46}
          icon={<UserOutlined className="!text-neutral-500" />}
        />
        <div>
          <div className="text-[11pt] font-semibold text-white">
            {user?.name || "Guest"}
          </div>
          <div className="text-sm text-white uppercase">
            {user?.departement || "─"}
          </div>
        </div>
      </div>

      <Badge dot={true}>
        <BellFilled
          className="text-xl !text-white cursor-pointer"
          onClick={handleClick}
        />
      </Badge>

      {/* Alert Notification */}
      <div
        className={`fixed left-1/2 -translate-x-1/2 transition-all duration-500 ease-out ${
          showAlert ? "top-4 opacity-100 z-50" : "top-0 opacity-0 -z-10"
        }`}
      >
        <Alert
          key={alertKey}
          message="Maaf fitur ini sedang dalam proses pengerjaan."
          type="info"
          showIcon
          closable
          className="w-[350px] shadow-md"
        />
      </div>
    </div>
  );
}

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

  return (
    <div className="flex items-end justify-center text-white -mb-11">
      <div className="flex items-end font-semibold tracking-wide">
        <span className="text-6xl">
          {time.hours}.{time.minutes}
        </span>
        <span className="text-3xl">.{time.seconds}</span>
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

  const today = new Date();
  const hari = today.toLocaleDateString("id-ID", { weekday: "long" });
  const tanggal = today.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

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
      <div className="flex justify-between p-4">
        <div className="flex gap-4">
          <FieldTimeOutlined className="text-[40pt] !text-[#12549a]" />
          <div className="flex flex-col">
            <p>Reguler</p>
            <p className="font-semibold">08.00 - 17.00</p>
            <p className="font-semibold text-blue-500">
              Masuk:{" "}
              {userData?.scan_masuk
                ? userData.scan_masuk.replace(":", ".")
                : "─"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p>{hari},</p>
          <p>{tanggal}</p>
          <p className="font-semibold text-blue-500">
            Pulang:{" "}
            {userData?.scan_keluar
              ? userData.scan_keluar.replace(":", ".")
              : "─"}
          </p>
        </div>
      </div>
      {/* <Divider className="!m-0 text-neutral-200" />
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
      </div> */}

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

export default function MainPage() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);

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

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // Ambil data hanya jika user ada
      fetchData(parsedUser);
    }
  }, []);

  const baseMenus = [
    {
      name: "Buletin",
      icon: <NewsIcon />,
      disable: true,
      visible: false,
      link: "/izin",
    },
    // {
    //   name: "Izin",
    //   icon: <FileDoneOutlined />,
    //   disable: true,
    //   visible: false,
    //   link: "/izin",
    // },
    // {
    //   name: "Kontribusi",
    //   icon: <GiftOutlined />,
    //   disable: true,
    //   visible: true,
    // },
    // {
    //   name: "Penawaran",
    //   icon: <DollarCircleOutlined />,
    //   disable: true,
    //   visible: true,
    // },
    {
      name: "Kehadiran",
      icon: <TeamOutlined />,
      disable: true,
      visible: true,
      link: "/employee-attendance",
    },
    {
      name: "Approval",
      icon: <CheckOutlined />,
      disable: true,
      visible: true,
      link: "/approval",
    },
    {
      name: "Perbaikan",
      icon: <ToolOutlined />,
      disable: true,
      visible: true,
      link: "https://docs.google.com/forms/d/e/1FAIpQLSf7NCLF9IFJ3ehv45B4WKWh2Whn-WrgI6_SHgWZ32eyMe4opw/viewform?pli=1",
      external: true,
    },
    {
      name: "Identifikasi",
      icon: <SearchOutlined />,
      disable: true,
      visible: true,
      link: "https://docs.google.com/spreadsheets/d/1uDpbqk6b4YLYNC9ds9iZCUaretgE1Vx5hl9r-1JLH6Y/edit?gid=22500260#gid=22500260",
      external: true,
    },
    {
      name: "Lokasi",
      icon: <AddLocationAltOutlinedIcon />,
      disable: false,
      visible: false,
      link: "/location",
    },
  ];

  const menus = useMemo(() => {
    if (!user) return baseMenus;

    const hasCheckAbsen = user.group_name?.includes("Online Absen Check");
    const isTeknisi = user.group_name?.includes("Online Teknisi");

    return baseMenus.map((menu) => {
      let updatedMenu = { ...menu };

      // Jika user Check Absen Online → disable beberapa menu
      if (hasCheckAbsen && ["Kehadiran", "Approval"].includes(menu.name)) {
        updatedMenu.visible = false;
        updatedMenu.disable = false;
      }

      // Jika user Teknisi → aktifkan Perbaikan & Identifikasi
      if (isTeknisi && ["Perbaikan", "Identifikasi"].includes(menu.name)) {
        updatedMenu.visible = false;
        updatedMenu.disable = false;
      }

      return updatedMenu;
    });
  }, [user]);

  return (
    <>
      <div className="relative flex flex-col justify-center w-full px-4 py-6 bg-[#12549a]">
        <div className="relative z-10">
          <Header user={user} />
          <Timer />
          <Card userData={userData} />
        </div>
      </div>

      <div className="w-full p-6 mt-15">
        <div className="font-semibold mb-4">Menu Utama</div>

        <div className="grid grid-cols-4 gap-4 items-start mb-10">
          {menus
            .filter((menu) => !menu.visible)
            .map((menu, index) => {
              const content = (
                <div
                  className={`flex flex-col items-center justify-center ${
                    !menu.disable ? "cursor-pointer" : "cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`w-14 h-14 flex items-center justify-center rounded-full transition text-[18pt] bg-white ${
                      !menu.disable
                        ? "shadow-md hover:bg-blue-500 hover:text-white text-blue-500"
                        : "text-neutral-300"
                    }`}
                  >
                    {menu.icon}
                  </div>
                  <span className="text-xs text-center mt-2 text-neutral-700 font-medium">
                    {menu.name}
                  </span>
                </div>
              );

              if (menu.disable) return <div key={index}>{content}</div>;

              if (menu.external)
                return (
                  <a
                    key={index}
                    href={menu.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {content}
                  </a>
                );

              return (
                <Link key={index} href={menu.link}>
                  {content}
                </Link>
              );
            })}
        </div>
      </div>
    </>
  );
}
