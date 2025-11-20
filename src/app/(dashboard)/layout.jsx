"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloseOutlined,
  UserOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { Divider, Avatar } from "antd";
import { ProfileProvider, useProfile } from "@/context/ProfileContext"; // ✅ Import useProfile juga
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import FingerprintRoundedIcon from "@mui/icons-material/FingerprintRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";

function Drawer() {
  const { showProfile, setShowProfile } = useProfile(); // ✅ ambil dari context
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  return (
    <AnimatePresence>
      {showProfile && (
        <>
          <motion.div
            className="absolute inset-0 bg-black/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProfile(false)}
          />
          <motion.div
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            transition={{ duration: 0.3, ease: "easeIn" }}
            className="absolute top-0 left-0 h-full bg-white shadow-lg z-40 w-full sm:w-sm py-4 px-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Profil Pengguna</span>
                <CloseOutlined
                  onClick={() => setShowProfile(false)}
                  className="text-neutral-500 hover:text-black cursor-pointer"
                />
              </div>
              <Divider className="!my-4" />
              <div className="flex flex-col items-center w-full px-4">
                <Avatar size={150} icon={<UserOutlined />} className="!my-4" />
                <div className="text-lg font-semibold">
                  {user?.name || "Guest"}
                </div>
                <div className="text-neutral-500 mb-3 uppercase">
                  {user?.departement || "─"}
                </div>

                <Divider className="!my-3" />

                <div className="w-full space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>NIK</span>
                    <span className="font-semibold">{user?.nik || ""}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Departemen</span>
                    <span className="font-semibold uppercase">
                      {user?.departement || ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cabang</span>
                    <span className="font-semibold">{user?.cabang || ""}</span>
                  </div>
                </div>
              </div>
            </div>

            <div
              onClick={handleLogout}
              className="w-full py-2 bg-red-200 hover:bg-red-300 text-red-500 text-center font-semibold rounded-lg cursor-pointer transition-all duration-300 active:scale-[0.98]"
            >
              Keluar
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function NavBack({ isHiddenNavBack = true }) {
  const pathname = usePathname();
  const router = useRouter();

  const menuTitles = {
    "/history": "Histori",
    "/izin": "Izin",
    "/kontribusi": "Kontribusi",
    "/penawaran": "Penawaran",
    "/employee-attendance": "Kehadiran",
    "/approval": "Approval",
    "/perbaikan": "Perbaikan",
    "/identifikasi": "Identifikasi",
    "/location": "Lokasi",
  };

  if (isHiddenNavBack) return null;

  const currentTitle = menuTitles[pathname] || "";

  return (
    <div className="grid grid-cols-3 items-center fixed md:absolute w-full top-0 h-14 left-1/2 z-20 -translate-x-1/2 bg-white border border-gray-200 text-xl">
      <div className="flex items-center pl-4">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-10 h-10 bg-white rounded-full active:opacity-70 active:bg-neutral-200 transition cursor-pointer"
        >
          <ArrowBackIosNewIcon fontSize="small" />
        </button>
      </div>

      {currentTitle && (
        <span className="select-none text-center">{currentTitle}</span>
      )}
    </div>
  );
}

function FooterMenu({ isHiddenFooter = true }) {
  const pathname = usePathname();

  const menus = [
    { name: "Beranda", icon: <HomeRoundedIcon />, link: "/main" },
    {
      name: "Absen Live",
      icon: <FingerprintRoundedIcon fontSize="large" />,
      link: "/attendance",
    },
    { name: "Histori", icon: <HistoryRoundedIcon />, link: "/history" },
  ];

  return (
    <AnimatePresence mode="wait">
      {!isHiddenFooter && (
        <motion.div
          key="footer-menu"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 15,
            duration: 0.3,
          }}
          className="fixed md:absolute w-full bottom-0 left-1/2 z-20 -translate-x-1/2"
        >
          <div className="w-full mx-auto bg-white border-t border-neutral-200 flex justify-around pb-1 h-16">
            {menus.map((menu, index) => {
              const isActive = pathname === menu.link;
              return (
                <Link
                  key={index}
                  href={menu.link}
                  className={`flex flex-col items-center justify-center text-xs transition-all duration-200 ${
                    index === 1
                      ? "relative -top-5"
                      : isActive
                      ? "text-blue-600"
                      : "text-neutral-600 hover:text-blue-500"
                  }`}
                >
                  {index === 1 ? (
                    <div className="flex flex-col items-center">
                      <div
                        className={`aspect-square w-16 rounded-full flex items-center justify-center text-2xl cursor-pointer transition text-white ${
                          isActive
                            ? "bg-blue-600"
                            : "bg-[#12549a] hover:bg-blue-600"
                        }`}
                      >
                        {menu.icon}
                      </div>
                      <span
                        className={`font-medium relative top-1 ${
                          isActive ? "text-blue-600" : ""
                        }`}
                      >
                        {menu.name}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div
                        className={`text-xl mb-1 cursor-pointer ${
                          isActive ? "text-blue-600" : ""
                        }`}
                      >
                        {menu.icon}
                      </div>
                      <span
                        className={`font-medium ${
                          isActive ? "text-blue-600" : ""
                        }`}
                      >
                        {menu.name}
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LayoutContent({ children }) {
  const pathname = usePathname();
  const visibleNavBack = ["/main", "/attendance"];
  const visibleFooter = ["/main", "/attendance", "/history"];
  const isHiddenNavBack =
    visibleNavBack.includes(pathname) || pathname.startsWith("/camera/");
  const isHiddenFooter = !visibleFooter.includes(pathname);

  return (
    <div className="flex w-full h-screen items-center justify-center bg-neutral-950 text-[11pt] text-neutral-600">
      <div className="relative flex flex-col w-full md:w-auto md:aspect-[9/16] h-full bg-gray-100 overflow-hidden">
        <NavBack isHiddenNavBack={isHiddenNavBack} />
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
        {!isHiddenFooter && <div className="h-17 bg-gray-100" />}
        <FooterMenu isHiddenFooter={isHiddenFooter} />

        {/* pastikan Drawer tetap di dalam sini */}
        <Drawer />
      </div>
    </div>
  );
}

export default function MainLayout({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (!user) {
      router.replace("/"); // redirect ke halaman login
    } else {
      setAuthorized(true);
    }
  }, []);

  if (!authorized)
    return (
      <div className="flex flex-col gap-4 w-full h-screen items-center justify-center bg-white text-sm text-[#12549a]">
        <div className="flex justify-center items-center text-3xl border-2 rounded-full aspect-square w-10 h-auto">
          <LoadingOutlined />
        </div>
        <span>Loading...</span>
      </div>
    );

  return (
    <ProfileProvider>
      <LayoutContent>{children}</LayoutContent>
    </ProfileProvider>
  );
}
