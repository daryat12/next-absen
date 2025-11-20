"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Divider, Typography, Drawer, List, Alert } from "antd";
import {
  MailOutline as MailIcon,
  LockOutlined as LockIcon,
  Help as HistoryIcon,
} from "@mui/icons-material";
import { CloseOutlined } from "@ant-design/icons";

import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/config/firebase";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [logVisible, setLogVisible] = useState(false);
  const [alert, setAlert] = useState({ type: "", message: "", show: false });
  const [authorized, setAuthorized] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setLogVisible(true);
    const user = localStorage.getItem("user");
    if (user) {
      router.replace("/main");
    } else {
      setAuthorized(true);
    }
  }, []);

  const handleLogin = async (values) => {
    setLoading(true);
    setAlert({ type: "", message: "", show: false });

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, loginWith: "email_password" }),
      });

      const data = await res.json();

      if (data.message === "success") {
        localStorage.setItem("user", JSON.stringify(data.data));
        setAlert({ type: "success", message: "Login berhasil!", show: true });

        // redirect setelah sedikit delay agar user bisa lihat alert
        setTimeout(() => router.push("/main"), 1000);
      } else {
        setAlert({
          type: "error",
          message: data.message || "Login gagal",
          show: true,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      setAlert({
        type: "error",
        message: "Terjadi kesalahan koneksi",
        show: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setAlert({ type: "", message: "", show: false });

    try {
      const result = await signInWithPopup(auth, provider);

      // Ambil user info dari Firebase
      const firebaseUser = result.user;

      // Bisa kirim ke API kamu kalau butuh sinkronisasi backend
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: firebaseUser.email,
          Password: null,
          loginWith: "google",
        }),
      });

      const data = await res.json();

      if (data.message === "success") {
        localStorage.setItem("user", JSON.stringify(data.data));
        setAlert({ type: "success", message: "Login berhasil!", show: true });
        setTimeout(() => router.push("/main"), 1000);
      } else {
        setAlert({
          type: "error",
          message: data.message || "Login gagal",
          show: true,
        });
      }
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") return;

      console.error("Google login error:", error);
      setAlert({
        type: "error",
        message: "Gagal login dengan Google",
        show: true,
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  const GoogleSVG = ({ className }) => (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block" }}
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.55-.18-2.27H12v4.54h6.48a5.54 5.54 0 0 1-2.4 3.63v3h3.84c2.25-2.07 3.54-5.12 3.54-8.9z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.83l-3.84-3c-1.08.72-2.47 1.14-4.09 1.14-3.15 0-5.82-2.13-6.77-5.01H1.25v3.09A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.23 14.3a7.2 7.2 0 0 1 0-4.6V6.61H1.25a12 12 0 0 0 0 10.78l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.82 0 3.43.63 4.71 1.86l3.5-3.5A11.94 11.94 0 0 0 12 0 12 12 0 0 0 1.25 6.61l3.98 3.09C6.18 6.88 8.85 4.75 12 4.75z"
      />
    </svg>
  );

  // contoh data log
  const logs = [
    {
      version: "v2.0.0",
      desc: [
        "Tampilan baru yang lebih fresh",
        "Tampilan baru timestamp absen",
        "Pin lokasi mesin",
        "Cek lokasi mesin",
        "Akselerasi perpindahan antar halaman",
        "Sistem keamanan",
      ],
    },
    {
      version: "v1.4.0",
      desc: ["Login dengan akun Google (email terdaftar)", "Sistem keamanan"],
    },
  ];

  if (!authorized)
    return (
      <div className="flex w-full h-screen items-center justify-center bg-white">
        <span className="text-sm text-[#12549a]">Loading...</span>
      </div>
    );

  return (
    <div className="flex justify-center min-h-screen bg-white relative">
      {alert.show && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <Alert type={alert.type} message={alert.message} showIcon closable />
        </div>
      )}
      {/* Sisi Kiri */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-[#12549A] text-white">
        <div className="text-center px-8">
          <h1 className="text-3xl font-bold mb-3">Selamat Datang!</h1>
          <p className="text-blue-50">
            Masuk untuk mengakses dashboard dan fitur lainnya.
          </p>
          <Divider className="!border-white/20" />
          <p className="text-sm">version 2.0.0</p>
          <div className="flex justify-center mt-1">
            <button
              onClick={() => setLogVisible(true)}
              className="flex justify-center items-center gap-1 text-white/50 hover:text-white/60 text-xs cursor-help"
            >
              <span className="select-none">apa yang baru</span>
              <HistoryIcon className="!text-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* Form Login */}
      <div className="flex items-center justify-center w-md p-6 relative">
        <div className="w-full max-w-xs text-sm">
          {/* HEADER / LOGO */}
          <div className="flex flex-col items-center mb-3">
            <img src="/logo.png" alt="Logo" className="w-50 h-auto mb-3" />
          </div>

          {/* LOGIN WITH GOOGLE */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full mb-4 flex items-center justify-center gap-2 font-medium border border-gray-300 hover:border-blue-500 rounded-md p-2 bg-white text-gray-700 transition-colors relative cursor-pointer"
          >
            {googleLoading ? (
              <span className="animate-spin border-2 border-gray-400 border-t-transparent rounded-full w-6 h-6"></span>
            ) : (
              <GoogleSVG className="w-6 h-6" />
            )}
            <span
              className={`select-none ${googleLoading ? "opacity-50" : ""}`}
            >
              Login with Google
            </span>
          </button>

          <Divider className="!font-normal !text-gray-400 !text-sm">or</Divider>

          {/* EMAIL & PASSWORD LOGIN */}
          <Form layout="vertical" onFinish={handleLogin} requiredMark={false}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: "Silahkan masukkan email anda" },
                { type: "email", message: "Format email tidak valid" },
              ]}
            >
              <Input
                prefix={<MailIcon className="text-gray-400 mr-1" />}
                placeholder="your@email.com"
                className="!py-2"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Silahkan masukkan password anda" },
              ]}
            >
              <Input.Password
                prefix={<LockIcon className="text-gray-400 mr-1" />}
                placeholder="••••••••"
                className="!py-2"
              />
            </Form.Item>

            <button
              type="submit"
              disabled={loading}
              className="flex justify-center gap-2 w-full mt-2 p-[10px] bg-[#12549A] text-white font-medium rounded-md hover:bg-sky-900 transition-colors relative cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="animate-spin border-2 border-white/50 border-t-transparent rounded-full w-5 h-5"></span>
                  <span className="text-white/50">Authentication...</span>
                </>
              ) : (
                <span className="select-none">Login</span>
              )}
            </button>
          </Form>

          {/* Tombol Lihat Log */}
          <div className="md:hidden flex justify-between items-center mt-4 text-black/30">
            <span>version 2.0.0</span>
            <button
              onClick={() => setLogVisible(true)}
              className="flex items-center gap-1 text-gray-600 hover:text-[#12549A] text-xs cursor-help"
            >
              <span className="select-none">apa yang baru</span>
              <HistoryIcon fontSize="small" />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute left-0 bottom-0 flex justify-center gap-1 pl-2 pr-4 py-1 bg-black/70 text-white/70 text-xs rounded-tr-lg">
        <span>copyright © 2025 |</span>
        <a
          href="https://radiance.id"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/70 hover:underline"
        >
          radiance.id
        </a>
      </div>

      {/* Drawer Log Update */}
      <Drawer
        title={
          <div className="flex items-center justify-between mb-3">
            <Typography.Title level={5} className="!mb-0">
              Log update aplikasi
            </Typography.Title>
            <CloseOutlined
              onClick={() => setLogVisible(false)}
              className="text-neutral-500 hover:text-black cursor-pointer"
            />
          </div>
        }
        placement="left"
        open={logVisible}
        onClose={() => setLogVisible(false)}
        closable={false}
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #f0f0f0",
          width: "100%",
        }}
        className="!w-full sm:!w-sm"
      >
        {/* Isi List Log */}
        <List
          dataSource={logs}
          renderItem={(item) => (
            <List.Item>
              <div>
                <Typography.Text strong className="block mb-1">
                  {item.version}
                </Typography.Text>
                <ul className="list-disc list-inside text-gray-600 text-md">
                  {item.desc.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>
            </List.Item>
          )}
        />
      </Drawer>
    </div>
  );
}
