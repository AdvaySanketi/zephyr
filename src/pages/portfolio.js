import React, { useContext, useEffect, useState } from "react";
import UserContext from "../context/userContext";
import Link from "next/link";
import PiechartComponent from "../components/PiechartComponent";
import { useRouter } from "next/router";
import LoadingSpinner from "../components/LoadingSpinner";
import Head from "next/head";

const Portfolio = () => {
  const { userData, setUserData } = useContext(UserContext);

  const router = useRouter();

  const [tokens, setTokens] = useState();
  const [activeCoins, setActiveCoins] = useState();
  const [details, setDetails] = useState({
    portfolioValue: 0,
    totalInvested: 0,
    totalReturns: 0,
    returnsPercentage: 0,
  });

  const fetchActive = async () => {
    const response = await fetch(
      `http://localhost:5000/api/exchange/fetchactive`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
        },
      }
    );

    const data = await response.json();
    setTokens(data.tokens);
    setActiveCoins(data.tokenIds);
  };

  useEffect(() => {
    if (tokens && activeCoins) {
      const getLivePrices = async () => {
        const queryIds = activeCoins.join(",");

        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${queryIds}&vs_currencies=inr&include_24hr_change=true`;
        const prices_response = await fetch(url);
        const prices_data = await prices_response.json();

        let totalInvested = 0,
          portfolioValue = 0,
          totalReturns = 0,
          returnsPercentage = 0;

        for (let i = 0; i < tokens.length; i++) {
          let id = tokens[i].token_id;
          tokens[i].price = prices_data[id];
          totalInvested += tokens[i].quantity * tokens[i].averageCost;
          portfolioValue += tokens[i].quantity * prices_data[id].inr;
        }

        totalReturns = portfolioValue - totalInvested;
        returnsPercentage = (totalReturns / totalInvested) * 100;

        setDetails({
          portfolioValue: portfolioValue,
          totalInvested: totalInvested,
          totalReturns: totalReturns,
          returnsPercentage: returnsPercentage,
        });
      };

      getLivePrices();
    }
  }, [tokens, activeCoins]);

  useEffect(() => {
    if (userData === null) {
      router.push("/explore");
    }
    if (userData) {
      fetchActive();
    }
  }, [userData]);

  const formatFloat = (number, toFixedN) => {
    const doubleNumber = Number(number);

    if (isNaN(doubleNumber)) {
      throw new Error("Invalid number provided");
    }

    return parseFloat(doubleNumber.toFixed(toFixedN)).toLocaleString("en-IN");
  };

  const formatFloat2 = (number, toFixedN, sign) => {
    let floatStr =
      "₹" +
      parseFloat(Math.abs(number).toFixed(toFixedN)).toLocaleString("en-IN");
    if (sign) {
      if (number >= 0) {
        return "+" + floatStr;
      } else {
        return "-" + floatStr;
      }
    }
    return floatStr;
  };

  if (tokens === undefined) {
    return (
      <div className="py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (tokens.length < 1) {
    return (
      <div className="mx-auto max-w-7xl my-10 sm:px-6 lg:px-8">
        <p className="py-8 text-center text-zinc-200">
          Your portfolio is currently empty.
        </p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>The Zephyr Project | Portfolio</title>
      </Head>
      {userData && (
        <>
          <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 mt-2 flex flex-wrap items-start">
            <div className="w-full flex flex-col md:flex-row gap-3 my-4">
              <div className="w-full h-24 flex p-4 rounded-xl bg-lime-200">
                <div className="flex-row self-center">
                  <p className="text-xs font-medium text-zinc-700">
                    Current Value
                  </p>
                  <h3 className="text-xl font-semibold text-zinc-800">
                    {formatFloat2(details.portfolioValue, 2, false)}
                  </h3>
                </div>
              </div>

              <div className="w-full h-24 flex p-4 rounded-xl bg-lime-200">
                <div className="flex-row self-center">
                  <p className="text-xs font-medium text-zinc-700">
                    Total Returns
                  </p>
                  <h3
                    className={`text-xl flex items-center font-semibold text-zinc-800`}
                  >
                    {formatFloat2(details.totalReturns, 2, true)}
                    <span
                      className={`text-sm ms-2 font-semibold px-3 py-1 rounded-full ${
                        details.totalReturns > 0
                          ? "border border-zinc-800 text-zinc-800"
                          : "border border-zinc-800 text-zinc-800"
                      }`}
                    >
                      {details.returnsPercentage > 0
                        ? "+" + formatFloat(details.returnsPercentage, 2)
                        : formatFloat(details.returnsPercentage, 2)}
                      %
                    </span>
                  </h3>
                </div>
              </div>

              <div className="w-full h-24 flex flex-col justify-center p-4 rounded-xl bg-lime-200">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-medium text-zinc-700">
                    Invested Value (INR)
                  </p>
                  <h1 className="text-md font-semibold text-zinc-800">
                    ₹{formatFloat(details.totalInvested, 2)}
                  </h1>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs font-medium text-zinc-700">
                    INR Balance
                  </p>
                  <h3 className="text-md font-semibold text-zinc-800">
                    ₹
                    {userData && userData != undefined
                      ? formatFloat(userData.cash, 2)
                      : "0"}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 mt-2 flex flex-wrap items-start">
            <div className="lg:w-full md:w-full w-full">
              <p className="text-md text-zinc-200 py-4">All Assets</p>

              <div className="overflow-x-auto pb-4 border border-zinc-750 rounded-lg">
                <div className="table w-full">
                  <div className="table-header-group">
                    <div className="table-row">
                      <div className="table-cell text-xs border-b border-r bg-background md:bg-inherit md:border-x-0 sticky left-0 md:static dark:border-zinc-750 font-medium px-6 py-2 text-slate-400 dark:text-zinc-500 text-left">
                        Asset name
                      </div>
                      <div className="table-cell text-xs border-b dark:border-zinc-750 font-medium p-4 py-2 text-slate-400 dark:text-zinc-500 text-left">
                        Price
                      </div>
                      <div className="table-cell text-xs border-b dark:border-zinc-750 font-medium p-4 py-2 text-slate-400 dark:text-zinc-500 text-left">
                        Holdings
                      </div>
                      <div className="table-cell text-xs border-b whitespace-nowrap dark:border-zinc-750 font-medium p-4 py-2 text-slate-400 dark:text-zinc-500 text-left">
                        Invested INR
                      </div>
                      <div className="table-cell text-xs border-b dark:border-zinc-750 font-medium p-4 py-2 text-slate-400 dark:text-zinc-500 px-6 text-right">
                        Returns
                      </div>
                    </div>
                  </div>
                  <div className="table-row-group">
                    {tokens[0].price &&
                      tokens.map((token) => {
                        let tokenUrl = `coins/${token.token_id}`;
                        let investedValue = token.quantity * token.averageCost;
                        let totalReturns =
                          token.price.inr * token.quantity - investedValue;
                        let returnsPercentage =
                          (totalReturns / investedValue) * 100;
                        return (
                          <div
                            key={token.token_id}
                            className="table-row text-white"
                          >
                            <div className="table-cell border-b border-r bg-background md:bg-inherit md:border-x-0 sticky left-0 md:static border-zinc-750 dark:border-zinc-750 p-4 px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                              <div className="flex w-max items-baseline">
                                <img
                                  src={token.image_url}
                                  alt={token.name}
                                  className="self-center w-6 h-6 rounded-full"
                                />
                                <div className="ms-3">
                                  <Link
                                    href={tokenUrl}
                                    className="font-medium text-md hover:underline"
                                  >
                                    {token.name}
                                  </Link>
                                  <p className="text-sm text-zinc-400">
                                    {token.symbol.toUpperCase()}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="table-cell text-sm border-b border-zinc-750 p-4">
                              ₹{token.price.inr.toLocaleString("en-IN")}
                            </div>
                            <div className="table-cell border-b border-zinc-750 p-4">
                              <p className="font-medium text-sm">
                                ₹
                                {formatFloat(
                                  token.quantity * token.price.inr,
                                  2
                                )}
                              </p>
                              <p className="text-sm text-zinc-400">
                                {formatFloat(token.quantity, 3)}
                                {token.symbol.toUpperCase()}
                              </p>
                            </div>
                            <div className="table-cell text-sm border-b border-zinc-750 p-4">
                              ₹{formatFloat(investedValue, 2)}
                            </div>
                            <div
                              className={`table-cell text-sm whitespace-nowrap border-b border-zinc-750 p-4 px-6`}
                            >
                              <div className="flex justify-end">
                                <p
                                  className={`text-sm font-medium ${
                                    totalReturns >= 0
                                      ? "text-green-300"
                                      : "text-red-400"
                                  }`}
                                >
                                  {formatFloat2(totalReturns, 2, true)}
                                </p>
                                <p
                                  className={`text-xs font-medium px-3 py-1 ms-2 rounded-full ${
                                    returnsPercentage >= 0
                                      ? "border border-green-300 text-green-300"
                                      : "border border-red-400 text-red-400"
                                  }`}
                                >
                                  {returnsPercentage > 0
                                    ? "+" + formatFloat(returnsPercentage, 2)
                                    : "" + formatFloat(returnsPercentage, 2)}
                                  %
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-full w-full my-4">
              <p className="text-md text-zinc-200 py-2">Insights</p>

              {tokens[0].price && (
                <div className="overflow-x-auto">
                  <PiechartComponent
                    portfolioValue={details.portfolioValue}
                    tokens={tokens}
                  />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Portfolio;
