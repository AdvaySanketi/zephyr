import React, { useEffect, useState } from "react";

const Toast = ({ showToast, setShowToast, toastMessage }) => {

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  return (
    <>
    {showToast && 
    <div
      id="toast-success"
      className="fixed z-50 bottom-4 left-1/2 transform -translate-x-1/2 flex items-center w-full max-w-xs p-4 mb-4 text-zinc-800 shadow-2xl shadow-zinc-900 rounded-lg bg-lime-200"
      role="alert"
    >
      <div className="text-sm font-medium">{toastMessage}</div>
      <button
        type="button"
        className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-600 dark:hover:text-zinc-900 dark:bg-lime-200"
        onClick={() => setShowToast(false)}
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <svg
          aria-hidden="true"
          className="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          ></path>
        </svg>
      </button>
    </div>
  }
  </>
  );
};

Toast.defaultProps = {
  showToast: false,
};

export default Toast;
