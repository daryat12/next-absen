"use client";

import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { Avatar, Badge, Dropdown, Empty } from "antd";
import { useProfile } from "@/context/ProfileContext";
import {
  UserOutlined,
  BellFilled,
  FieldTimeOutlined,
  GiftOutlined,
  DollarCircleOutlined,
  FileDoneOutlined,
  TeamOutlined,
  CheckOutlined,
  ToolOutlined,
  SearchOutlined,
  ScheduleOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import AddLocationAltOutlinedIcon from "@mui/icons-material/AddLocationAltOutlined";
import { NewspaperOutlined as NewsIcon } from "@mui/icons-material";

function Header({ user }) {
  const { setShowProfile } = useProfile();
  const [notif, setNotif] = useState([]);
  const [notifTiket, setNotifTiket] = useState([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const fetchNotif = async (parsedUser) => {
    try {
      const possibleGroups = ["Super Admin", "Online Absen Check"];
      const group =
        possibleGroups.find((g) => parsedUser.group_name?.includes(g)) || "";
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CI_API_URL}/api/NextAbsen/getNotif`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ci-Key": process.env.NEXT_PUBLIC_CI_KEY || "",
          },
          body: JSON.stringify({
            group,
            cabang: parsedUser.alias || "",
          }),
        }
      );

      const result = await response.json();
      if (result.status) {
        setNotif(result.data || []);
      } else {
        setNotif([]);
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    }
  };

  const fetchNotifTiket = async (parsedUser) => {
    try {
      const possibleGroups = ["Super Admin", "Online Absen Check"];
      const group =
        possibleGroups.find((g) => parsedUser.group_name?.includes(g)) || "";
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CI_API_URL}/api/NextAbsen/getNotifTiket`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ci-Key": process.env.NEXT_PUBLIC_CI_KEY || "",
          },
          body: JSON.stringify({
            group,
            cabang: parsedUser.alias || "",
            username: parsedUser.username || "",
          }),
        }
      );

      const result = await response.json();
      if (result.status) {
        setNotifTiket(result.data || []);
      } else {
        setNotifTiket([]);
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    }
  };

  useEffect(() => {
    if (user) fetchNotif(user);
    if (user) fetchNotifTiket(user);
  }, [user]);

  const hasNotifs = Array.isArray(notif) && notif.length > 0;
  const hasNotifsTiket = Array.isArray(notifTiket) && notifTiket.length > 0;

  const allowedGroups = ["Super Admin", "Online Absen Check"];

  const isAllowedGroup = allowedGroups.some((g) =>
    user?.group_name?.includes(g)
  );

  const dropdownItems = [

    ...(isAllowedGroup
      ? [
        {
          key: "notif-header",
          disabled: true,
          label: (
            <div className="font-bold text-blue-500 border-b pb-1">
              Notifikasi Absen
            </div>
          ),
        },

        ...(hasNotifs
          ? notif.map((row, index) => ({
            key: `notif-${index}`,
            label: (
              <Link
                href={row.link || "#"}
                className="block font-semibold px-2 py-1 hover:bg-neutral-100 rounded-md"
              >
                {row.notif} ({row.jumlah} {row.satuan})
              </Link>
            ),
          }))
          : [
            {
              key: "notif-empty",
              disabled: true,
              label: (
                <div className="text-center text-gray-400 py-2">
                  Tidak ada notif absen
                </div>
              ),
            },
          ]),

        {
          type: "divider",
        },
      ]
      : []),

    {
      key: "tiket-header",
      disabled: true,
      label: (
        <div className="font-bold text-blue-500 border-b pb-1">
          Notifikasi Tiket
        </div>
      ),
    },

    ...(hasNotifsTiket
      ? notifTiket.map((row, index) => ({
        key: `tiket-${index}`,
        label: (
          <Link
            href={row.link || "#"}
            className="block font-semibold px-2 py-1 hover:bg-neutral-100 rounded-md"
          >
            {row.notif} ({row.jumlah} {row.satuan})
          </Link>
        ),
      }))
      : [
        {
          key: "tiket-empty",
          disabled: true,
          label: (
            <div className="text-center text-gray-400 py-2">
              Tidak ada notif tiket
            </div>
          ),
        },
      ]),
  ];

  useEffect(() => {
    if (notif.length > 0) {
      setDropdownVisible(true); // buka dropdown saat load
      const timer = setTimeout(() => setDropdownVisible(false), 10000); // tutup 10 detik
      return () => clearTimeout(timer);
    }
  }, [notif]);

  useEffect(() => {
    if (notifTiket.length > 0) {
      setDropdownVisible(true); // buka dropdown saat load
      const timer = setTimeout(() => setDropdownVisible(false), 10000); // tutup 10 detik
      return () => clearTimeout(timer);
    }
  }, [notifTiket]);

  return (
    <div className="flex justify-between mb-10 px-2">
      <div
        className="flex items-center gap-3 cursor-pointer select-none"
        onClick={() => setShowProfile(true)}
      >
        <Avatar
          size={46}
          src={user?.photo}
          icon={
            !user?.photo ? <UserOutlined className="!text-neutral-500" /> : null
          }
          className={!user?.photo ? "!bg-white" : ""}
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

      {/* <Dropdown
        menu={{ items }}
        placement="bottomRight"
        trigger={["click"]}
        open={dropdownVisible}
        onOpenChange={(open) => setDropdownVisible(open)}
        popupRender={(menu) => <div style={{ marginTop: "-20px" }}>{menu}</div>}
      >
        <Badge dot={hasNotifs}>
          <BellFilled className="text-xl !text-white cursor-pointer" />
        </Badge>
      </Dropdown> */}

      <Dropdown
        menu={{ items: dropdownItems }}
        placement="bottomRight"
        trigger={["click"]}
        open={dropdownVisible}
        onOpenChange={(open) => setDropdownVisible(open)}
      >
        <Badge dot={hasNotifs || hasNotifsTiket}>
          <BellFilled className="text-xl !text-white cursor-pointer" />
        </Badge>
      </Dropdown>
    </div>
  );
}

function Card({ userData }) {
  const today = new Date();
  const hari = today.toLocaleDateString("id-ID", { weekday: "long" });
  const tanggal = today.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-xl relative top-20 shadow-md">
      <div className="flex justify-between p-4 pr-8">
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
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const userEmailList = JSON.parse(localStorage.getItem("userEmail")) || [];

    if (storedUser) {
      const match = userEmailList.find(
        (item) => item.email === storedUser.username
      );

      setUser({
        ...storedUser,
        photo: match?.photo || null,
      });

      fetchData(storedUser);
    }
  }, []);

  const baseMenus = [
    {
      name: "Buletin",
      icon: <NewsIcon />,
      disable: true,
      visible: false,
      link: "/bulletin",
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
    //   link: "/kontribusi",
    // },
    // {
    //   name: "Penawaran",
    //   icon: <DollarCircleOutlined />,
    //   disable: true,
    //   visible: true,
    //   link: "/penawaran",
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
      link: "/repair",
    },
    {
      name: "Identifikasi",
      icon: <SearchOutlined />,
      disable: true,
      visible: true,
      link: "/identification",
      external: false, //hanya untuk link external
    },
    {
      name: "Tiket",
      icon: <ScheduleOutlined />,
      disable: true,
      visible: true,
      link: "/tiket",
      external: false, //hanya untuk link external
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
    const isSuperAdmin = user.group_name?.includes("Super Admin");

    // Jika Super Admin → semua menu buka, disable = false, visible = true
    if (isSuperAdmin) {
      return baseMenus.map((menu) => ({
        ...menu,
        disable: false,
        visible: false,
      }));
    }

    return baseMenus.map((menu) => {
      let updatedMenu = { ...menu };

      // Jika user Check Absen Online → disable beberapa menu
      if (hasCheckAbsen && ["Kehadiran", "Approval"].includes(menu.name)) {
        updatedMenu.visible = false;
        updatedMenu.disable = false;
      }

      // Jika user Teknisi → aktifkan Perbaikan & Identifikasi
      if (isTeknisi && ["Perbaikan", "Identifikasi", "Tiket"].includes(menu.name)) {
        updatedMenu.visible = false;
        updatedMenu.disable = false;
      }

      return updatedMenu;
    });
  }, [user]);

  const logo = "/camera/ext/logo.png";

  return (
    <>
      <div className="relative flex flex-col justify-center w-full px-4 py-6 bg-[#12549a]">
        <div className="relative z-10">
          <Header user={user} />
          <div className="flex justify-center items-center -mb-15">
            <div className="relative w-[250px] h-[110px]">
              <Image
                src={logo}
                alt="Logo"
                fill
                sizes="250px"
                className="object-contain invert brightness-0 opacity-60 select-none"
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
                priority
              />

              <div
                className="absolute inset-0 pointer-events-none shine-mask"
                style={{
                  WebkitMaskImage: `url(${logo})`,
                  maskImage: `url(${logo})`,
                }}
              ></div>
            </div>
          </div>
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
                  className={`flex flex-col items-center justify-center ${!menu.disable ? "cursor-pointer" : "cursor-not-allowed"
                    }`}
                >
                  <div
                    className={`w-14 h-14 flex items-center justify-center rounded-full transition text-[18pt] bg-white ${!menu.disable
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
