import React, { useContext, useEffect, useRef, useState } from "react";
import { Metadata } from "next";
import TokenList from "../components/TokenList";
import TokenContext from "../context/tokenContext";
import UserContext from "../context/userContext";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Head from "next/head";
import Image from "next/image";
import ModalContext from "../context/modalContext";

const Explore = () => {
  const { userData } = useContext(UserContext);
  const { tokens, setTokens, watchlisted, setWatchlisted } =
    useContext(TokenContext);

  const [allTokens, setAllTokens] = useState(true);
  const [watchlistCount, setWatchlistCount] = useState(0);

  const { showModal, setShowModal, isLogin, setIsLogin } =
    useContext(ModalContext);

  const watchlistBtn = () => {
    setAllTokens(!allTokens);
  };

  const fetchWatchlisted = async () => {
    const response = await fetch(
      `http://localhost:5000/api/exchange/fetchwatchlisted`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
      }
    );
    const data = await response.json();

    if (data && data.length > 0) {
      const queryParams = await data.join("%2c%20");
      const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=inr&ids=${queryParams}&sparkline=false`;

      const current_prices_response = await fetch(url);
      const prices_data = await current_prices_response.json();

      await prices_data.forEach((token) => {
        token.iswatchlisted = true;
      });

      setWatchlisted(prices_data);
      setWatchlistCount(prices_data.length);
      return prices_data;
    }

    return [];
  };

  const fetchTokens = async ({ pageParam = 1 }) => {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=inr&order=market_cap_desc&per_page=10&page=${pageParam}&sparkline=false`,
      {
        method: "GET",
      }
    );
    const data = await response.json();
    if (tokens) {
      setTokens([...tokens, ...data]);
    } else {
      setTokens(data);
    }

    return data;
  };

  const coinsQuery = useInfiniteQuery({
    queryKey: ["all-coins"],
    queryFn: fetchTokens,
    staleTime: Infinity,
    keepPreviousData: true,
    cacheTime: Infinity,
    getNextPageParam: (lastPage, pages) => {
      const nextPage = lastPage.length === 10 ? pages.length + 1 : undefined;
      return nextPage;
    },
  });

  const watchlistedQuery = useQuery({
    queryKey: ["watchlisted-coins"],
    queryFn: fetchWatchlisted,
    staleTime: Infinity,
    cacheTime: Infinity,
    enabled: userData !== null && userData !== undefined,
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (
      userData !== null &&
      userData !== undefined &&
      watchlistedQuery.data === null
    ) {
      watchlistedQuery.refetch();
    }

    if (userData === null) {
      setWatchlisted([]);
      setWatchlistCount(0);
      queryClient.removeQueries(["watchlisted-coins"]);
    }
  }, [userData]);

  useEffect(() => {
    if (coinsQuery.data && watchlisted) {
      const updatedTokens = coinsQuery.data.pages.map((page) => {
        return page.map((token) => {
          const watchlistedItem = watchlisted.find(
            (item) => item.id === token.id
          );
          if (watchlistedItem) {
            return { ...token, iswatchlisted: true };
          } else {
            return { ...token, iswatchlisted: false };
          }
        });
      });

      queryClient.setQueryData(["all-coins"], {
        ...coinsQuery.data,
        pages: updatedTokens,
      });
    }
  }, [coinsQuery.data, watchlisted]);

  useEffect(() => {
    if (watchlistedQuery.data) {
      if (allTokens) {
        queryClient.setQueryData(["watchlisted-coins"], watchlisted);
      }
      if (watchlisted) {
        setWatchlistCount(watchlisted.length);
      }
    }
  }, [allTokens, watchlisted]);

  const loadMore = () => {
    coinsQuery.fetchNextPage();
  };

  useEffect(() => {
    if (queryClient.getQueryData(["scrollPosition", "all-coins"])) {
      window.scrollTo(
        0,
        queryClient.getQueryData(["scrollPosition", "all-coins"])
      );
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      queryClient.setQueryData(
        ["scrollPosition", "all-coins"],
        window.pageYOffset,
        { cacheTime: Infinity }
      );
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleLoginModal = () => {
    setShowModal(true);
    setIsLogin(true);
  };

  const toggleSignupModal = () => {
    setShowModal(true);
    setIsLogin(false);
  };

  let justBtn =
    "px-2 py-4 sm:mr-3 sm:text-sm focus:outline-none text-center basis-1/2 sm:basis-auto";

  let selectedBtnClass = justBtn + " text-zinc-200 border-b border-zinc-200";

  let unselectedBtnClass = justBtn + " text-zinc-400 hover:text-zinc-200";

  return (
    <>
      <Head>
        <title>The Zephyr Project | Explore</title>
      </Head>
      {userData ? (
        <div className="bg-zinc-800/80 border-b border-zinc-700">
          <div className="flex justify-center sm:justify-start mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
            <button
              type="button"
              className={allTokens ? selectedBtnClass : unselectedBtnClass}
              onClick={watchlistBtn}
            >
              All Cryptos
            </button>

            <button
              type="button"
              className={`${
                allTokens ? unselectedBtnClass : selectedBtnClass
              } inline-flex justify-center`}
              onClick={watchlistBtn}
            >
              Watch List
              <span className="ms-2 px-2 rounded-sm bg-zinc-700">
                {watchlistCount}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-800/80 mx-auto mb-4 mt-4 rounded-lg max-w-7xl px-3 sm:px-6 lg:px-8 flex sm:flex-row flex-col-reverse justify-center sm:justify-between items-center border-b border-zinc-750">
          <div className="rounded-md my-8 inline-flex flex-col mt-0 sm:mt-8 justify-center sm:justify-start">
            <p className="text-xl text-center sm:text-left text-zinc-200">
              Trade, manage, and maximize your Crypto Investments effortlessly.
            </p>
            <p className="text-sm text-zinc-400 text-center sm:text-left">
              <button className="underline" onClick={toggleLoginModal}>
                Login{" "}
              </button>{" "}
              or{" "}
              <button className="underline" onClick={toggleSignupModal}>
                {" "}
                Signup
              </button>{" "}
              to start your journey.
            </p>
          </div>
          <Image
            className="me-6 opacity-40"
            src="/heroSection.png"
            width={220}
            height={48}
          />
        </div>
      )}

      {coinsQuery.isError && (
        <div className="mx-auto max-w-7xl my-10 sm:px-6 lg:px-8">
          <p className="py-8 text-center text-zinc-200">
            Some error occured. Please try again after a while.
            <br />
            If you're logged in, you still should be able to access your
            portfolio and transactions.
          </p>
        </div>
      )}

      {coinsQuery.isSuccess && (
        <TokenList
          tokenList={
            allTokens
              ? coinsQuery.data.pages.flat()
              : userData
              ? watchlistedQuery.data
              : coinsQuery.data.pages.flat()
          }
          watchlisted={!allTokens}
        />
      )}

      {allTokens && !coinsQuery.isError && (
        <div className="flex justify-center mt-3 pb-6">
          <button
            disabled={coinsQuery.isFetching}
            type="button"
            className={`rounded-full mx-auto text-sm border p-2 px-6 border-zinc-700 text-zinc-400 flex items-center ${
              !coinsQuery.isLoading &&
              "cursor-pointer hover:text-zinc-200 disabled:border-zinc-800 disabled:cursor-not-allowed"
            }`}
            onClick={loadMore}
          >
            {coinsQuery.isFetching ? (
              <>
                <svg
                  aria-hidden="true"
                  role="status"
                  className="inline w-6 h-6 mr-3 text-gray-200 animate-spin dark:text-zinc-700 fill-lime-200"
                  viewBox="0 0 100 101"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                    fill="currentColor"
                  />
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" />
                </svg>
                <p>loading...</p>
              </>
            ) : (
              <p>Load more</p>
            )}
          </button>
        </div>
      )}
    </>
  );
};

export default Explore;
