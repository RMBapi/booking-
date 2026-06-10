"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils";

interface ModalContextType {
  openName: string;
  open: (name: string) => void;
  close: () => void;
}

const ModalContext = createContext<ModalContextType>({
  openName: "",
  open: () => {},
  close: () => {},
});

// Hook exports for external control
export const useOpenModal = () => useContext(ModalContext).open;
export const useCloseModal = () => useContext(ModalContext).close;

// Sub-components
function ModalOpen({
  children,
  opens,
}: {
  children: React.ReactElement<{
    onClick?: React.MouseEventHandler<HTMLElement>;
  }>;
  opens: string;
}) {
  const { open } = useContext(ModalContext);
  return React.cloneElement(children, {
    onClick: (event) => {
      children.props.onClick?.(event);
      open(opens);
    },
  });
}

function ModalClose({ children }: { children: React.ReactNode }) {
  const { close } = useContext(ModalContext);
  return <div onClick={close}>{children}</div>;
}

function ModalBody({
  children,
  name,
  className,
  size = "md",
  hideDefaultClose = false,
  overlayClassName,
}: {
  children: React.ReactNode;
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  hideDefaultClose?: boolean;
  overlayClassName?: string;
}) {
  const { openName, close } = useContext(ModalContext);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (name === openName) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [name, openName]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && name === openName) {
        close();
      }
    };

    if (name === openName) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [name, openName, close]);

  if (name !== openName) return null;
  if (typeof document === "undefined") return null;

  const sizeStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
    full: "max-w-5xl",
  };

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-200",
        overlayClassName,
      )}
      onClick={close}
    >
      <div
        className={cn(
          "relative w-full bg-white dark:bg-gray-800",
          "rounded-t-2xl sm:rounded-2xl shadow-2xl",
          "max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto custom-scrollbar",
          "animate-in zoom-in-95 fade-in-0 duration-200",
          "pb-[env(safe-area-inset-bottom,0px)]",
          sizeStyles[size],
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        {!hideDefaultClose && (
          <button
            onClick={close}
            className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

// Main component with attached sub-components
function Modal({ children }: { children: React.ReactNode }) {
  const [openName, setOpenName] = useState("");

  return (
    <ModalContext.Provider
      value={{
        openName,
        open: setOpenName,
        close: () => setOpenName(""),
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

Modal.Body = ModalBody;
Modal.Open = ModalOpen;
Modal.Close = ModalClose;

export { Modal };
