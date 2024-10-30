import React, { useContext, useState } from "react";
import ModalContext from "../context/modalContext";
import UserContext from "../context/userContext";
import LoadingSpinner from "./LoadingSpinner";

const Signup = () => {
  const { userData, setUserData, authtoken, setAuthtoken } =
    useContext(UserContext);

  const { setShowModal, setIsLogin } = useContext(ModalContext);
  const [isLoading, setIsLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const onUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  const onEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const onPasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const goToSignup = () => {
    setIsLogin(true);
  };

  const signupBtn = async (e) => {
    e.preventDefault();

    setIsLoading(true);
    const response = await fetch(`http://localhost:5000/api/auth/createuser`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        email: email,
        password: password,
      }),
    });
    const json = await response.json();
    setIsLoading(false);
    if (json.success) {
      localStorage.setItem("token", json.authToken);
      setAuthtoken(json.authToken);
      setShowModal(false);
      setUsername("");
      setEmail("");
      setPassword("");
    } else {
      if (json.errors) {
        console.log(error);
        setError(json.errors[0].msg);
      } else {
        setError(json.error.msg);
      }
    }
  };

  return (
    <>
      <div className="relative w-full h-full max-w-md md:h-auto">
        <div className="relative rounded-xl">
          <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
            Create a new account
          </h3>
          <form className="space-y-6" method="POST" onSubmit={signupBtn}>
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
                className="bg-gray-50 border border-zinc-300 text-gray-900 text-sm rounded-lg focus:ring-lime-200 focus:border-lime-200 block w-full p-2.5 dark:bg-zinc-800 dark:border-zinc-750 dark:placeholder-zinc-400 dark:text-white"
                placeholder="Enter username"
                required
                onChange={onUsernameChange}
                value={username}
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="block mb-2 text-xs font-medium text-gray-900 dark:text-zinc-200"
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-lime-200 focus:border-lime-200 block w-full p-2.5 dark:bg-zinc-800 dark:border-zinc-750 dark:placeholder-zinc-400 dark:text-white"
                placeholder="Enter your email address"
                required
                onChange={onEmailChange}
                value={email}
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
                placeholder="Enter new password"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-lime-200 focus:border-blue-500 block w-full p-2 dark:bg-zinc-800 dark:border-zinc-750 dark:placeholder-zinc-400 dark:text-white"
                required
                onChange={onPasswordChange}
                value={password}
              />
            </div>
            {!isLoading ? (
              <button
                type="submit"
                className="w-full text-lime-900 bg-blue-700 focus:ring-4 focus:outline-none focus:ring-lime-100 font-medium rounded-lg text-sm px-5 py-2 text-center dark:bg-lime-200"
              >
                Create account
              </button>
            ) : (
              <LoadingSpinner />
            )}
            <div className="text-xs font-medium text-gray-500 dark:text-zinc-400">
              Already have an account?{" "}
              <a
                onClick={goToSignup}
                className="text-lime-200 hover:underline dark:text-lime-200 cursor-pointer"
              >
                Login
              </a>
            </div>
            {isLoading && (
              <div className="mt-2 p-2 border border-zinc-600 text-xs text-zinc-400 bg-zinc-750/75 rounded-md">
                This may take a few seconds to load due to inactivity.
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
};

export default Signup;
