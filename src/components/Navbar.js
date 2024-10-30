import React, { useContext, useEffect, useRef, useState } from "react";
import UserContext from "../context/userContext";
import dynamic from "next/dynamic";
import ModalContext from "../context/modalContext";
import Link from "next/link";
import { useRouter } from "next/router";
import LoadingBar from "react-top-loading-bar";

const AuthModal = dynamic(() => import("./UserAuthModal"), { ssr: false });

const Navbar = () => {
  const { userData, setUserData, authtoken, setAuthtoken } =
    useContext(UserContext);

  const [showDropdown, setShowDropdown] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const { showModal, setShowModal, isLogin, setIsLogin } =
    useContext(ModalContext);

  const menuRef = useRef();

  const toggleLoginModal = () => {
    setShowModal(true);
    setIsLogin(true);
  };

  const toggleSignupModal = () => {
    setShowModal(true);
    setIsLogin(false);
  };

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    setShowDropdown(false);
    setUserData(null);
    setAuthtoken(null);
  };

  const router = useRouter();
  const { pathname } = router;

  const onMenuExpand = () => {
    setShowMenu(true);
  };

  const onMenuClose = () => {
    setShowMenu(false);
  };

  const onDropDownBtnClick = (e) => {
    e.stopPropagation();

    setShowDropdown(!showDropdown);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        setShowDropdown
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (document) {
      document.body.style.overflow = showMenu ? "hidden" : "auto";
    }
  }, [showMenu]);

  return (
    <>
      <nav
        className={`${
          showMenu ? "bg-background" : "bg-background/75"
        } backdrop-blur-xl border-b border-zinc-750 z-50 sticky top-0`}
      >
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
          <div className="relative flex h-14 items-center justify-between">
            <div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md p-2 text-zinc-400 hover:bg-inherit"
                aria-controls="mobile-menu"
              >
                <span className="sr-only">Open main menu</span>

                <svg
                  className={`${!showMenu ? "block" : "hidden"} h-6 w-6`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                  onClick={onMenuExpand}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                  />
                </svg>

                <svg
                  className={`${showMenu ? "block" : "hidden"} h-6 w-6`}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  aria-hidden="true"
                  onClick={onMenuClose}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {userData ? (
              <div
                className={`absolute inset-y-0 right-0 items-center sm:hidden flex`}
              >
                <button
                  id="dropdownAvatarNameButton"
                  className={`flex items-center border-gray-500 text-gray-300 hover:bg-zinc-700 hover:text-white rounded-md p-2 text-sm font-medium ${
                    showDropdown ? "bg-zinc-700" : "bg-inherit"
                  }`}
                  type="button"
                  onClick={onDropDownBtnClick}
                >
                  <span className="sr-only">Open user menu</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path
                      d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"
                      fillRule="evenodd"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="absolute inset-y-0 right-0 items-center sm:hidden flex">
                <button
                  className="border border-lime-200 text-lime-200 hover:bg-zinc-800 hover:text-lime-300 rounded-md px-3 py-2 text-sm font-medium"
                  onClick={toggleLoginModal}
                >
                  Login
                </button>
              </div>
            )}

            {/* dropdown menu */}

            {userData && (
              <div
                ref={menuRef}
                id="dropdownAvatarName1"
                className={`z-10 ${
                  showDropdown ? "block" : "hidden"
                } absolute top-16 right-0 bg-white divide-y divide-zinc-200 rounded-lg shadow-2xl shadow-zinc-900 w-52 dark:bg-zinc-800 dark:divide-zinc-700`}
              >
                <div className="p-4 py-3">
                  <div className="font-medium text-zinc-400 text-sm">
                    {userData.name}
                  </div>
                  <div className="truncate text-sm text-zinc-400">
                    {userData.email}
                  </div>
                </div>

                <div className="mx-4 py-3 mt-0 border-t border-zinc-600 text-zinc-400">
                  <div className="text-xs">INR Balance</div>
                  <div className="text-sm">
                    ₹
                    {parseFloat(userData.cash.toFixed(1)).toLocaleString(
                      "en-IN"
                    )}
                  </div>
                </div>

                <div className="py-2">
                  <p
                    onClick={handleLogout}
                    className="block cursor-pointer px-4 py-2 text-sm w-100 text-gray-700 hover:bg-gray-100 dark:hover:bg-zinc-700 dark:text-zinc-200 dark:hover:text-white"
                  >
                    Sign out
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-1 items-center justify-center sm:items-stretch sm:justify-start">
              <div className="flex flex-shrink-0 items-center">
                <Link
                  href="/explore"
                  className="flex no-underline items-center"
                >
                  <h1 className="text-white font-medium text-lg">
                    The Zephyr Project
                  </h1>
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex justify-between w-full">
                <div className="flex">
                  <Link
                    href="/explore"
                    className={`rounded-md px-5 py-2 hover:text-lime-200 text-sm ${
                      pathname === "/explore"
                        ? " text-lime-200 border border-zinc-750"
                        : " text-zinc-200 no-underline"
                    }`}
                    aria-current={pathname === "/explore" ? "page" : undefined}
                  >
                    Explore
                  </Link>
                  {userData && (
                    <>
                      <Link
                        href="/portfolio"
                        className={`rounded-md px-5 py-2 hover:text-lime-200 text-sm ${
                          pathname === "/portfolio"
                            ? " text-lime-200 border border-zinc-750"
                            : " text-zinc-200 no-underline"
                        }`}
                        aria-current={
                          pathname === "/portfolio" ? "page" : undefined
                        }
                      >
                        Portfolio
                      </Link>

                      <Link
                        href="/transactions"
                        className={`rounded-md px-5 py-2 hover:text-lime-200 text-sm ${
                          pathname === "/transactions"
                            ? " text-lime-200 border border-zinc-750"
                            : " text-zinc-200 no-underline"
                        }`}
                        aria-current={
                          pathname === "transactions" ? "page" : undefined
                        }
                      >
                        Transactions
                      </Link>
                    </>
                  )}
                </div>

                {userData ? (
                  <div className="flex space-x-4">
                    <button
                      id="dropdownAvatarNameButton"
                      className={`flex items-center bg-zinc-800 border-zinc-500 text-zinc-300 hover:bg-zinc-700 hover:text-white rounded-md p-2 text-sm font-medium ${
                        showDropdown ? "bg-zinc-700" : "bg-inherit"
                      }`}
                      type="button"
                      onClick={onDropDownBtnClick}
                    >
                      <span className="sr-only">Open user menu</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                      >
                        <path
                          d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4Zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10Z"
                          fillRule="evenodd"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex space-x-4">
                    <button
                      className="border  border-lime-200 text-lime-200 hover:bg-zinc-800 hover:text-lime-100 rounded-md px-3 text-sm font-medium"
                      onClick={toggleLoginModal}
                    >
                      Login
                    </button>

                    <button
                      className="bg-lime-200 text-lime-900 rounded-md px-3 text-sm font-medium"
                      onClick={toggleSignupModal}
                    >
                      Signup
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Mobile menu */}
        <div
          className={`${showMenu ? "block" : "hidden"} sm:hidden h-screen`}
          id="mobile-menu"
        >
          <div
            className={`space-y-1 bg-background p-3 border-t border-zinc-750`}
          >
            <Link
              href="/explore"
              className={`block px-3 py-2 hover:text-lime-200 text-center ${
                pathname === "/explore"
                  ? " text-lime-200 border border-zinc-750 rounded-md"
                  : " text-zinc-200 no-underline"
              }`}
              aria-current="page"
              onClick={() => setShowMenu(false)}
            >
              Explore
            </Link>

            {userData && (
              <>
                <Link
                  href="/portfolio"
                  className={`block px-3 py-2 hover:text-lime-200 text-center ${
                    pathname === "/portfolio"
                      ? " text-lime-200 border border-zinc-750 rounded-md"
                      : " text-zinc-200 no-underline"
                  }`}
                  onClick={() => setShowMenu(false)}
                >
                  Portfolio
                </Link>

                <Link
                  href="/transactions"
                  className={`block px-3 py-2 hover:text-lime-200 text-center ${
                    pathname === "/transactions"
                      ? " text-lime-200 border border-zinc-750 rounded-md"
                      : " text-zinc-200 no-underline"
                  }`}
                  onClick={() => setShowMenu(false)}
                >
                  Transactions
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <AuthModal />
    </>
  );
};

export default Navbar;
