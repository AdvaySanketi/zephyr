import { useRouter } from "next/router";
import React, { useContext, useEffect, useRef, useState } from "react";
import UserContext from "../../context/userContext";
import Link from "next/link";
import WatchList from "../../components/WatchList";
import { Modal } from "flowbite-react";
import ModalContext from "../../context/modalContext";
import LoadingSpinner from "../../components/LoadingSpinner";
import Toast from "../../components/Toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Head from "next/head";

const Token = () => {
  const { userData, setUserData } = useContext(UserContext);

  const {
    showModal: showLoginModal,
    setShowModal: setShowLoginModal,
    isLogin,
    setIsLogin,
  } = useContext(ModalContext);

  const [query, setQuery] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [tokenDetails, setTokenDetails] = useState();

  const [activeDetails, setActiveDetails] = useState([]);
  const [transactionDetails, settransactionDetails] = useState([]);

  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [returnPercentage, setReturnPercentage] = useState(0);

  const [isBuy, setIsBuy] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [totalValue, setTotalValue] = useState(0);

  const [buyError, setBuyError] = useState("");
  const [sellError, setSellError] = useState("");

  const [ismodalActive, setIsModalActive] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const pathname = router.query.token;
    if (pathname) {
      setQuery(pathname);
    }
  }, [router.query]);

  useEffect(() => {
    if (userData) {
      setIsLoggedIn(true);
    } else if (userData === null) {
      setIsLoggedIn(false);
    }
  }, [userData]);

  const fetchTokens = async (token) => {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${token}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`,
      {
        method: "GET",
      }
    );

    const data = await response.json();
    return data;
  };

  const fetchdetails = async (token_id) => {
    const response = await fetch(
      `http://localhost:5000/api/exchange/fetchdetails?token_id=${token_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
      }
    );
    const data = await response.json();
    console.log(data);
    setActiveDetails(data.result[0]);
    if (data.result && data.result.length > 0) {
      settransactionDetails(data.result);
    } else {
      settransactionDetails([]);
    }
    setIsWatchlisted(data.iswatchlisted);
  };

  useEffect(() => {
    if (activeDetails && tokenDetails) {
      let investedValue = activeDetails.quantity * activeDetails.averageCost;
      let totalReturns =
        tokenDetails.market_data.current_price.inr * activeDetails.quantity -
        investedValue;
      setReturnPercentage((totalReturns / investedValue) * 100);
    }
  }, [activeDetails]);

  const coinQuery = useQuery({
    queryKey: ["fetched-coin", query],
    queryFn: () => {
      if (query) {
        return fetchTokens(query);
      } else {
        return [];
      }
    },
    staleTime: Infinity,
    cacheTime: Infinity,
    enabled: query.length > 0,
  });

  useEffect(() => {
    if (coinQuery && coinQuery.data) {
      if (coinQuery.data.error) {
        queryClient.setQueryData(["fetched-coin"], null);
        setTokenDetails(null);
      } else {
        setTokenDetails(coinQuery.data);
        setTotalValue(quantity * coinQuery.data.market_data.current_price.inr);
      }
      if (isLoggedIn) {
        fetchdetails(coinQuery.data.id);
      }
    }
  }, [coinQuery.data, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) {
      setActiveDetails(null);
      settransactionDetails(null);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (userData) {
      if (totalValue > userData.cash) {
        setBuyError("You don't have enough INR balance");
      } else {
        setBuyError("");
      }
    }
  }, [quantity, totalValue]);

  useEffect(() => {
    if (tokenDetails && activeDetails && quantity > activeDetails.quantity) {
      setSellError(
        `You don't have enough ${tokenDetails.symbol.toUpperCase()} balance`
      );
    } else {
      setSellError("");
    }
  }, [quantity, totalValue]);

  useEffect(() => setIsModalActive(true), []);

  useEffect(() => {
    if (document) {
      document.body.style.overflow = showModal ? "hidden" : "auto";
    }
  }, [showModal]);

  const buySellBtn = () => {
    setIsBuy(!isBuy);
  };

  const onQuantityChanged = (e) => {
    let quantityCount = Number(e.target.value);
    setQuantity(quantityCount);

    let totalValueCount =
      quantityCount * tokenDetails.market_data.current_price.inr;
    if (!quantityCount) {
      setTotalValue(0);
    } else {
      setTotalValue(totalValueCount);
    }
  };

  const onTotalValueChanged = (e) => {
    let totalValueCount = Number(e.target.value);
    setTotalValue(totalValueCount);
    if (!totalValueCount) {
      setQuantity(0);
    } else {
      setQuantity(
        Number(totalValueCount / tokenDetails.market_data.current_price.inr)
      );
    }
  };

  const onConfirmationClick = async (e) => {
    let body = JSON.stringify({
      symbol: tokenDetails.symbol,
      name: tokenDetails.name,
      token_id: tokenDetails.id,
      quantity: quantity,
      price: tokenDetails.market_data.current_price.inr,
      image_url: tokenDetails.image.large,
    });

    if (!quantity) {
      setShowModal(false);
      setToastMessage(`Please enter a valid quantity.`);
      setShowToast(true);
      return;
    }

    if (isBuy) {
      e.target.innerText = "Buying...";
      const response = await fetch(`http://localhost:5000/api/token/buy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
        body: body,
      });
      const json = await response.json();
      if (json.success) {
        setShowModal(false);
        setToastMessage(
          `Bought ${formatFloat(json.details.quantity, 3)} ${
            json.details.name
          } worth ${formatFloat(json.details.totalValue, 2)}INR!`
        );
        setShowToast(true);

        setUserData({
          ...userData,
          cash: userData.cash - parseFloat(totalValue.toFixed(2)),
        });

        if (activeDetails) {
          let newQuantity = activeDetails.quantity + quantity;
          let newTotalInvested =
            activeDetails.quantity * activeDetails.averageCost + totalValue;
          setActiveDetails({
            ...activeDetails,
            quantity: newQuantity,
            averageCost: newTotalInvested / newQuantity,
          });

          let totalReturns =
            tokenDetails.market_data.current_price.inr * newQuantity -
            newTotalInvested;
          setReturnPercentage((totalReturns / newTotalInvested) * 100);
        } else {
          setActiveDetails({
            ...activeDetails,
            quantity: quantity,
            averageCost: totalValue / quantity,
          });
          setReturnPercentage(0);
        }

        const now = new Date();
        const isoString = now.toISOString();
        let newTransaction = {
          txn_timestamp: isoString,
          symbol: tokenDetails.market_data.symbol,
          quantity: quantity,
          price: tokenDetails.market_data.current_price.inr,
        };
        settransactionDetails([newTransaction, ...transactionDetails]);

        setQuantity(0);
        setTotalValue(0);

        e.target.innerText = "Confirm Buy";
      } else {
        setShowModal(false);
        setToastMessage(json.error);
        setShowToast(true);
      }
    } else {
      e.target.innerText = "Selling...";
      const response = await fetch(`http://localhost:5000/api/token/sell`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
        body: body,
      });
      const json = await response.json();
      if (json.success) {
        setShowModal(false);
        setToastMessage(
          `Sold ${formatFloat(json.details.quantity, 3)} ${
            json.details.name
          } worth ${formatFloat(json.details.totalValue, 2)}INR!`
        );
        setShowToast(true);

        setUserData({
          ...userData,
          cash: userData.cash + parseFloat(totalValue.toFixed(2)),
        });
        let newQuantity = activeDetails.quantity - quantity;
        let newInvestedValue =
          activeDetails.quantity * activeDetails.averageCost - totalValue;

        if (newQuantity === 0) {
          setActiveDetails(null);
        } else {
          setActiveDetails({
            ...activeDetails,
            quantity: newQuantity,
            averageCost: newInvestedValue / newQuantity,
          });
        }

        let totalReturns =
          tokenDetails.market_data.current_price.inr * newQuantity -
          newInvestedValue;
        setReturnPercentage((totalReturns / newInvestedValue) * 100);

        const now = new Date();
        const isoString = now.toISOString();
        let newTransaction = {
          txn_timestamp: isoString,
          symbol: transactionDetails.symbol,
          quantity: quantity * -1,
          price: tokenDetails.market_data.current_price.inr,
        };
        settransactionDetails([newTransaction, ...transactionDetails]);

        setQuantity(0);
        setTotalValue(0);

        e.target.innerText = "Confirm Sell";
      } else {
        setShowModal(false);
        setToastMessage(json.error);
        setShowToast(true);
      }
    }
  };

  const openModal = () => {
    setShowModal(true);
  };

  const onModalClose = () => {
    setShowModal(false);
  };

  const onNonUserLoginBtnClick = () => {
    setIsLogin(true);
    setShowLoginModal(true);
  };

  const formatTime = (string) => {
    const date = new Date(string);
    const now = new Date();

    const diffInMilliseconds = now - date;
    const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays >= 7) {
      return Math.floor(diffInDays / 7) + "w ago";
    } else if (diffInDays >= 1) {
      return diffInDays + "d ago";
    } else if (diffInHours >= 1) {
      return diffInHours + "h ago";
    } else if (diffInMinutes >= 1) {
      return diffInMinutes + "m ago";
    } else {
      return diffInSeconds + "s ago";
    }
  };

  const formatFloat = (number, toFixedN) => {
    if (number === "0.00") {
      return parseFloat("0.00");
    }
    if (Math.abs(number) < 0.0001) {
      return parseFloat(number.toFixed(5));
    } else if (Math.abs(number) < 0.001) {
      return parseFloat(number.toFixed(4));
    } else {
      return parseFloat(number).toFixed(toFixedN).toLocaleString("en-IN");
    }
  };

  if (tokenDetails === undefined) {
    return (
      <div className="py-8">
        <LoadingSpinner />
      </div>
    );
  } else if (tokenDetails === null) {
    return (
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="flex flex-row justify-center my-10">
          <p className="p-2 py-8 mb-2 text-lg text-center text-zinc-200">
            Coin
            <span className="ps-1 font-medium italic">{query}</span> not found.
            Explore coins
            <Link
              href="/explore"
              className="ps-1 text-zinc-200 underline w-fit mx-auto hover:text-white"
            >
              here.
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>The Zephyr Project | {tokenDetails.name}</title>
      </Head>
      <div className="text-white">
        <nav
          className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 text-zinc-400 border-b border-zinc-750"
          aria-label="Breadcrumb"
        >
          <ol className="flex items-center space-x-1 md:space-x-3 py-2">
            <li className="inline-flex items-center">
              <Link
                href="/explore"
                className="inline-flex no-underline items-center text-xs font-medium hover:text-teal-600 dark:text-zinc-400 dark:hover:text-white"
              >
                Explore
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <p>/</p>
                <p className="ml-1 text-xs font-medium md:ml-2 dark:text-zinc-400 cursor-default">
                  {tokenDetails.name}
                </p>
              </div>
            </li>
          </ol>
        </nav>
        <div className="token-page min-h-[70vh] max-w-7xl px-3 sm:px-6 lg:px-8 py-2 my-3 mx-auto flex flex-wrap items-start justify-between">
          <div className="lg:w-4/6 md:w-3/5 md:pr-8 lg:pr-8 w-full pr-0">
            <div className="flex justify-between flex-row">
              <div className="flex items-center">
                <img
                  className="w-20 h-20 rounded-full"
                  src={tokenDetails.image.large}
                  alt="Rounded avatar"
                />
              </div>

              <div className="ms-3 flex flex-col grow lg:flex-row lg:justify-between lg:items-center">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline">
                    <h1 className="font-medium text-xl">{tokenDetails.name}</h1>
                    <p className="ps-2 text-zinc-400">
                      {tokenDetails.symbol.toUpperCase()}
                    </p>
                  </div>

                  <div className="ms-4">
                    <WatchList
                      token_id={isLoggedIn ? tokenDetails.id : false}
                      isWatchlisted={isWatchlisted}
                      isTokenPage={true}
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <h1 className="font-medium me-2 text-2xl">
                    ₹
                    {tokenDetails.market_data.current_price.inr.toLocaleString(
                      "en-IN"
                    )}
                  </h1>
                  {tokenDetails.market_data.price_change_percentage_24h >= 0 ? (
                    <p className="ms-2 px-4 text-sm rounded-full border border-green-400 text-green-400">
                      {tokenDetails.market_data.price_change_percentage_24h.toFixed(
                        2
                      )}
                      %
                    </p>
                  ) : (
                    <p className="ms-2 px-4 text-sm rounded-full border border-red-400 text-red-400">
                      {tokenDetails.market_data.price_change_percentage_24h.toFixed(
                        2
                      )}
                      %
                    </p>
                  )}
                </div>
              </div>
            </div>

            {activeDetails && activeDetails.length !== 0 && (
              <div className="bg-inherit border border-zinc-750 rounded-lg my-3">
                <h3 className="text-md text-zinc-200 p-3 border-b border-zinc-750">
                  Summary
                </h3>

                <div className="flex flex-col lg:flex-row">
                  <div className="basis-1/2  border-b lg:border-b-0 lg:border-r border-zinc-750 p-3">
                    <p className="text-xs text-zinc-400">Available Qty.</p>
                    <p className="font-medium">
                      {parseFloat(activeDetails.quantity).toFixed(5)}{" "}
                      {tokenDetails.symbol.toUpperCase()}
                    </p>
                    <p className="text-sm">
                      {formatFloat(
                        tokenDetails.market_data.current_price.inr *
                          activeDetails.quantity,
                        2
                      )}
                      INR
                      {returnPercentage >= 0 ? (
                        <span className="ps-2 text-green-400">
                          ({formatFloat(returnPercentage, 2)}%)
                        </span>
                      ) : (
                        <span className="ps-2 text-red-400">
                          ({formatFloat(returnPercentage, 2)}%)
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="basis-1/2  p-3">
                    <p className="text-xs text-zinc-400">Invested value</p>
                    <p className="font-medium">
                      {formatFloat(
                        activeDetails.quantity * activeDetails.averageCost,
                        2
                      )}
                      INR
                    </p>
                    <p className="text-sm text-zinc-300">
                      Avg Price :
                      <span className="text-zinc-200">
                        {formatFloat(activeDetails.averageCost, 2)}INR
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5">
              <p className="text-zinc-200 text-md mb-2">Market Data</p>
              <div className="flex gap-4">
                <div className="grow border-r-2 border-zinc-750">
                  <p className="text-xs text-zinc-400">Market Cap</p>
                  <p>
                    ₹
                    {tokenDetails.market_data.market_cap.inr.toLocaleString(
                      "en-IN"
                    )}
                  </p>
                </div>
                <div className="grow">
                  <p className="text-xs text-zinc-400">Total Volume</p>
                  <p>
                    ₹
                    {tokenDetails.market_data.total_volume.inr.toLocaleString(
                      "en-IN"
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-md text-zinc-200 mb-2">Additional Details</p>

              <div className="mb-2">
                <p className="text-xs text-zinc-400">Official Website</p>
                <a
                  href={tokenDetails.links.homepage[0]}
                  className="hover:underline"
                >
                  {tokenDetails.links.homepage[0]}
                </a>
              </div>
              <div className="mt-4">
                <p className="text-xs text-zinc-400">Description</p>
                {tokenDetails.description.en === "" ? (
                  <p>N.A</p>
                ) : (
                  <p
                    className="mb-3"
                    dangerouslySetInnerHTML={{
                      __html: tokenDetails.description.en,
                    }}
                  ></p>
                )}
              </div>
            </div>
          </div>

          <div className="lg:w-2/6 md:w-2/5 w-full">
            <div className="bg-background border border-zinc-750 rounded-xl text-zinc-200 flex flex-col md:ml-auto w-full mt-10 md:mt-0">
              <div className="flex py-6 px-4 text-sm border-b border-zinc-750">
                <button
                  className={`flex-1 text-center rounded-full py-2 border ${
                    isBuy
                      ? " border-lime-200 text-lime-200"
                      : " border-transparent text-zinc-400"
                  }`}
                  onClick={buySellBtn}
                >
                  Buy
                </button>
                <button
                  className={`flex-1 text-center rounded-full py-2 border ${
                    !isBuy
                      ? " border border-lime-200 text-lime-200"
                      : " border-transparent text-zinc-400"
                  }`}
                  onClick={buySellBtn}
                >
                  Sell
                </button>
              </div>

              <form>
                <div className="p-4 py-5">
                  <label
                    htmlFor="quantity"
                    className="block mb-2 text-sm text-zinc-200"
                  >
                    Enter Quantity
                  </label>
                  <div className="flex rounded-lg border border-zinc-750 focus-within:border-lime-200">
                    <span className="inline-flex items-center w-1/5 justify-center m-1.5 my-2 text-xs font-medium text-zinc-200  border-r border-zinc-750">
                      {tokenDetails.symbol.toUpperCase()}
                    </span>
                    <input
                      type="number"
                      id="quantity"
                      className="rounded-r-lg bg-inherit border-0 text-zinc-100 focus:ring-0 group block flex-1 min-w-0 w-full text-sm p-3"
                      placeholder="0.0"
                      min="0"
                      value={quantity ? parseFloat(quantity.toFixed(3)) : ""}
                      onChange={onQuantityChanged}
                    />
                  </div>
                </div>
                <div className="py-3 pt-0 px-4">
                  <label
                    htmlFor="totalValue"
                    className="block mb-2 text-sm text-zinc-200"
                  >
                    Total Value
                  </label>
                  <div className="flex rounded-lg border border-zinc-750 focus-within:border-lime-200">
                    <span className="inline-flex items-center w-1/5 justify-center m-1.5 my-2 text-xs font-medium text-zinc-200  border-r border-zinc-750">
                      INR
                    </span>
                    <input
                      type="number"
                      id="totalValue"
                      className="rounded-r-lg bg-inherit border-0 text-zinc-100 focus:ring-0 group block flex-1 min-w-0 w-full text-sm p-3"
                      placeholder="0.0"
                      min="0"
                      value={
                        totalValue ? parseFloat(totalValue.toFixed(2)) : ""
                      }
                      onChange={onTotalValueChanged}
                    />
                  </div>
                </div>

                {userData ? (
                  isBuy ? (
                    <>
                      <div className="px-4 text-zinc-400 flex justify-between text-xs">
                        <p className="mb-2">INR Balance</p>
                        <p>₹{userData.cash && formatFloat(userData.cash, 2)}</p>
                      </div>
                      {buyError && (
                        <div
                          className="mt-0 p-4 pb-0 text-sm text-yellow-100 rounded-lg"
                          role="alert"
                        >
                          <span className="font-medium"></span> {buyError}
                        </div>
                      )}

                      <div className="p-4 py-6">
                        <button
                          type="button"
                          className="w-full rounded-lg text-zinc-800 bg-lime-200 focus:ring-4 focus:outline-none focus:ring-lime-100 font-medium text-sm px-5 py-2.5 text-center"
                          onClick={openModal}
                        >
                          Buy
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="px-4 text-zinc-400 flex justify-between text-xs">
                        <p className="mb-2">
                          {tokenDetails.symbol.toUpperCase()} Balance
                        </p>
                        <p>
                          {activeDetails && activeDetails.quantity
                            ? formatFloat(activeDetails.quantity, 3)
                            : "0"}
                          {tokenDetails.symbol.toUpperCase()}
                        </p>
                      </div>
                      {sellError && (
                        <div
                          className="mt-0 p-4 pb-0 text-sm text-yellow-100 rounded-lg"
                          role="alert"
                        >
                          <span className="font-medium"></span> {sellError}
                        </div>
                      )}
                      <div className="p-4 py-6">
                        <button
                          type="button"
                          className="rounded-lg bg-lime-200  text-zinc-900 w-full focus:ring-4 focus:outline-none focus:ring-lime-100 font-medium text-sm px-5 py-2.5 text-center"
                          onClick={openModal}
                        >
                          Sell
                        </button>
                      </div>
                    </>
                  )
                ) : (
                  <div className="p-4 py-6">
                    <button
                      type="button"
                      className="text-zinc-800 bg-lime-200 w-full focus:ring-4 focus:outline-none focus:ring-lime-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                      onClick={onNonUserLoginBtnClick}
                    >
                      Login to buy/sell {tokenDetails.symbol.toUpperCase()}
                    </button>
                  </div>
                )}
              </form>
            </div>

            {transactionDetails &&
              transactionDetails[0] !== undefined &&
              transactionDetails.length > 0 && (
                <div className="border border-zinc-750 rounded-lg my-4 pb-4">
                  <h3 className="text-md p-4 text-zinc-200 border-b border-zinc-750">
                    Recent Transaction
                  </h3>

                  {transactionDetails.map((transaction) => {
                    return (
                      <div
                        className="border-b text-sm border-zinc-750 p-4"
                        key={transaction.txn_timestamp}
                      >
                        <div className="flex items-center">
                          <div className="w-full">
                            <div className="flex justify-between">
                              <p>
                                {transaction.quantity > 0 ? "Bought " : "Sold "}
                                {formatFloat(Math.abs(transaction.quantity), 3)}
                                {tokenDetails.symbol.toUpperCase()}{" "}
                                {transaction.quantity > 0 ? (
                                  <span className="font-medium">
                                    -
                                    {formatFloat(
                                      Math.abs(
                                        transaction.price * transaction.quantity
                                      ),
                                      2
                                    )}
                                    INR
                                  </span>
                                ) : (
                                  <span className="font-medium">
                                    +
                                    {formatFloat(
                                      Math.abs(
                                        transaction.price * transaction.quantity
                                      ),
                                      2
                                    )}
                                    INR
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-zinc-400">
                                {formatTime(transaction.txn_timestamp)}
                              </p>
                            </div>

                            <p className="text-sm text-zinc-300">
                              (@{formatFloat(transaction.price, 2)}INR)
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* modal */}

      {ismodalActive && (
        <Modal
          show={showModal}
          size="md"
          dismissible={true}
          onClose={onModalClose}
          className="bg-zinc-900 backdrop-opacity-10 border border-zinc-750"
          style={{ height: "100%", backdropFilter: "blur(6px)" }}
        >
          <Modal.Header className="bg-zinc-800 border text-md dark:border-zinc-750">
            Confirm Order
          </Modal.Header>
          <Modal.Body className="bg-zinc-800 text-zinc-200 border-x dark:border-zinc-750">
            <div className="space-y-2">
              <p className="">
                {isBuy
                  ? `Buy ${tokenDetails.name}`
                  : `Sell ${tokenDetails.name}`}
              </p>
              <div className="flex justify-between">
                <p className="text-sm">Price</p>
                <p className="text-sm">
                  {tokenDetails.market_data.current_price.inr.toLocaleString(
                    "en-IN"
                  )}{" "}
                  INR
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm">Quantity</p>
                <p className="text-sm">
                  {parseFloat(quantity.toFixed(3))}{" "}
                  {tokenDetails.symbol.toUpperCase()}
                </p>
              </div>
              <div className="flex justify-between">
                <p className="text-sm">Total</p>
                <p className="text-sm">
                  {parseFloat(totalValue.toFixed(2)).toLocaleString("en-IN")}{" "}
                  INR
                </p>
              </div>
            </div>
          </Modal.Body>
          <Modal.Footer className="bg-zinc-800 border dark:border-zinc-750">
            <button
              data-modal-hide="confirm-modal"
              type="button"
              onClick={onConfirmationClick}
              className="text-zinc-900 bg-lime-200 focus:ring-4 focus:outline-none focus:ring-lime-100 font-medium rounded-lg text-sm px-5 py-2.5 text-center w-full"
            >
              {isBuy ? "Confirm Buy" : "Confirm Sell"}
            </button>
          </Modal.Footer>
        </Modal>
      )}

      {showToast && (
        <Toast
          showToast={showToast}
          setShowToast={setShowToast}
          toastMessage={toastMessage}
        />
      )}
    </>
  );
};

export default Token;
