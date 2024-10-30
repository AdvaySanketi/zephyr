import React, { useContext, useState } from "react";
import ModalContext from "../context/modalContext";
import UserContext from "../context/userContext";
import LoadingSpinner from "./LoadingSpinner";

const Login = () => {
  const { userData, setUserData, authtoken, setAuthtoken } =
    useContext(UserContext);

  const { setShowModal, setIsLogin } = useContext(ModalContext);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const onUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const onPasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const goToLogin = () => {
    setIsLogin(false);
  };

  const loginBtn = (e) => {
    e.preventDefault();
    loginUser();
  };

  const loginUser = async (guest = false) => {
    setIsLoading(true);

    let bodyObj;
    bodyObj = JSON.stringify({
      username: username,
      password: password,
    });

    const response = await fetch(`http://localhost:5000/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: bodyObj,
    });
    const json = await response.json();
    setIsLoading(false);
    if (json.success) {
      localStorage.setItem("token", json.authToken);
      setAuthtoken(json.authToken);
      setShowModal(false);
      setUsername("");
      setPassword("");
    } else {
      setError(json.error);
    }
  };

  const guestLogin = (e) => {
    e.preventDefault();
    loginUser(true);
  };

  return (
    <>
      <div className="relative w-full h-full max-w-md md:h-auto">
        <div className="relative rounded-xl">
          <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
            Login
          </h3>
          <form className="space-y-6 pb-6" method="POST" onSubmit={loginBtn}>
            {error && (
              <div
                className="p-4 mb-4 text-sm rounded-lg border border-red-400/50 text-red-400/75"
                role="alert"
              >
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="username"
                className="block mb-2 text-xs font-medium text-gray-900 dark:text-zinc-200"
              >
                Username
              </label>
              <input
                type="text"
                name="username"
                id="username"
                className="bg-zinc-700 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-lime-200 focus:border-lime-200 block w-full p-2.5 dark:bg-zinc-800 dark:border-zinc-750 dark:placeholder-zinc-400 dark:text-white"
                placeholder="Enter your username"
                required
                onChange={onUsernameChange}
                value={username}
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block mb-2 text-xs font-medium text-gray-900 dark:text-zinc-200"
              >
                Password
              </label>
              <input
                type="password"
                name="password"
                id="password"
                placeholder="Enter your password"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-lime-200 focus:border-blue-500 block w-full p-2.5 dark:bg-zinc-800 dark:border-zinc-750 dark:placeholder-zinc-400 dark:text-white"
                required
                onChange={onPasswordChange}
                value={password}
              />
            </div>

            {!isLoading ? (
              <button
                type="submit"
                className="w-full text-lime-900 bg-lime-200 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2 text-center dark:bg-lime-200 dark:focus:ring-lime-200"
              >
                Login to your account
              </button>
            ) : (
              <LoadingSpinner />
            )}
            <div className="text-xs font-medium text-gray-500 dark:text-zinc-400">
              Don't have an account?{" "}
              <a
                onClick={goToLogin}
                className="text-zinc-200 hover:underline dark:text-lime-200 cursor-pointer"
              >
                Create account
              </a>
            </div>
          </form>

          {isLoading && (
            <div className="mt-2 p-2 border border-zinc-600 text-xs text-zinc-400 bg-zinc-750/75 rounded-md">
              This may take a few seconds to load due to inactivity.
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Login;
