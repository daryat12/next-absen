"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { CloseOutlined } from "@ant-design/icons";

export default function BottomPopup({
  open,
  onClose,
  children,
  title,
  dragDistance = true,
  maxHight = "90vh",
  backgroundOverlay = true,
  bodyPadding = "32px",
}) {
  const controls = useAnimation();
  const [startY, setStartY] = useState(0);

  // Auto scroll ke bawah
  const scrollToBottom = () =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });

  // Saat popup baru dibuka, pastikan muncul dari bawah
  useEffect(() => {
    if (open) {
      // Set posisi awal sebelum animasi
      scrollToBottom();
      controls.set({ y: "100%" });
      // Jalankan animasi naik
      controls.start({
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 30 },
      });
    }
  }, [open, controls]);

  const handleDragStart = (_, info) => {
    setStartY(info.point.y);
  };

  const handleDragEnd = async (_, info) => {
    const dragDistance = info.point.y - startY;

    // Jika drag ke bawah cukup jauh
    if (dragDistance > 150) {
      await controls.start({
        y: "110%",
        transition: { duration: 0.3, ease: "easeIn" },
      });
      onClose?.();
    } else {
      // Kembalikan ke posisi awal
      controls.start({
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 30 },
      });
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Background overlay */}
          {backgroundOverlay && (
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}

          {/* Popup container */}
          <motion.div
            key="popup"
            className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-lg flex flex-col touch-none"
            style={{ maxHeight: maxHight }}
            initial={{ y: "100%" }}
            animate={controls}
            exit={{ y: "110%" }}
            // Aktifkan drag hanya jika dragDistance = true
            drag={dragDistance ? "y" : false}
            dragConstraints={dragDistance ? { top: 0, bottom: 0 } : undefined}
            dragElastic={dragDistance ? { top: 0, bottom: 1 } : undefined}
            onDragStart={dragDistance ? handleDragStart : undefined}
            onDragEnd={dragDistance ? handleDragEnd : undefined}
          >
            {dragDistance && (
              <div className="flex justify-center mt-2">
                <div className="w-12 h-1.5 bg-neutral-300 rounded-full" />
              </div>
            )}

            <div
              className={`flex justify-between items-center px-8 py-2 ${
                !dragDistance ? "mt-3" : ""
              }`}
            >
              <h3 className="text-lg font-semibold whitespace-normal text-left w-80">
                {title || ""}
              </h3>
              <button
                className="flex justify-center items-center aspect-square w-8 h-auto active:bg-neutral-200 rounded-full cursor-pointer"
                onClick={onClose}
              >
                <CloseOutlined />
              </button>
            </div>
            <div
              className="relative overflow-y-auto flex-1 pb-6"
              style={{ paddingLeft: bodyPadding, paddingRight: bodyPadding }}
            >
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
