import Link from "next/link";
import React, { useContext, useEffect, useState } from "react";
import UserContext from "../context/userContext";
import { useRouter } from "next/router";
import LoadingSpinner from "../components/LoadingSpinner";
import Image from "next/image";
import Head from "next/head";

const transactions = () => {
  const { userData, setUserData } = useContext(UserContext);

  const [transactions, setTransactions] = useState();

  const router = useRouter();

  const fetchtransactions = async () => {
    const response = await fetch(
      `http://localhost:5000/api/exchange/fetchtransactions`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "auth-token": localStorage.getItem("token"),
          "Access-Control-Max-Age": 600,
        },
      }
    );
    const data = await response.json();
    setTransactions(data);
  };

  useEffect(() => {
    if (userData !== undefined && userData === null) {
      router.push("/explore");
    }
    if (userData) {
      fetchtransactions();
    }
  }, [userData]);

  const formatDateTime = (type, string) => {
    const date = new Date(string);
    const now = new Date();

    if (type === 1) {
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
    } else {
      const options = {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
        day: "numeric",
        month: "long",
        year: "numeric",
      };
      const formattedDate = date.toLocaleDateString("en-US", options);
      return formattedDate;
    }
  };

  const formatFloat = (number, toFixedN) => {
    const doubleNumber = Number(number);

    if (isNaN(doubleNumber)) {
      throw new Error("Invalid number provided");
    }

    return parseFloat(doubleNumber.toFixed(toFixedN)).toLocaleString("en-IN");
  };

  if (transactions === undefined) {
    return (
      <div className="py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (transactions.length < 1) {
    return (
      <div className="mx-auto max-w-7xl my-10 sm:px-6 lg:px-8">
        <p className="py-8 text-center text-zinc-200">
          You have no transactions yet.
        </p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>The Zephyr Project | Transactions</title>
      </Head>
      {userData && (
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          {transactions && transactions.length > 0 && (
            <>
              <h1 className="text-md text-zinc-200 py-4">Transactions</h1>

              <div className="overflow-x-auto border pb-4 border-zinc-750 mb-6 rounded-lg">
                <div className="table w-full text-sm text-left">
                  <div className="table-header-group text-xs text-zinc-500">
                    <div className="table-row font-medium text-zinc-400">
                      <div className="table-cell text-xs border-b border-r bg-background text-zinc-500 md:bg-background border-zinc-750 px-6 py-3 md:border-x-0 sticky left-0 md:static">
                        Asset name
                      </div>
                      <div className="table-cell text-xs border-b border-zinc-750 text-zinc-500 px-6 py-3">
                        Price
                      </div>
                      <div className="table-cell text-xs border-b border-zinc-750 text-zinc-500 px-6 py-3">
                        Quantity
                      </div>
                      <div className="table-cell text-xs border-b border-zinc-750 text-zinc-500 px-6 py-3">
                        Total Value
                      </div>
                      <div className="table-cell text-xs border-b border-zinc-750 text-zinc-500 px-6 py-3"></div>
                    </div>
                  </div>
                  <div className="table-row-group">
                    {transactions.map((transaction) => {
                      let totalValue = transaction.quantity * transaction.price;
                      let tokenUrl = `coins/${transaction.token_id}`;
                      return (
                        <div
                          key={transaction.txn_timestamp}
                          className="table-row text-white dark:bg-inherit dark:border-zinc-750"
                        >
                          <div className="table-cell border-b border-r bg-background md:bg-background border-zinc-750 px-6 py-4 font-medium md:border-x-0 sticky left-0 md:static text-gray-900 whitespace-nowrap dark:text-white">
                            <div className="flex w-max">
                              <Image
                                loader={() => transaction.image_url}
                                unoptimized={true}
                                src={transaction.image_url}
                                alt={transaction.name}
                                width={24}
                                height={24}
                                className="self-center w-6 h-6 rounded-full mx-1"
                              />

                              <div className="ms-3">
                                <Link
                                  href={tokenUrl}
                                  className="text-md font-medium hover:underline"
                                >
                                  {transaction.name}
                                </Link>
                                <p className="text-sm text-zinc-400">
                                  {transaction.symbol.toUpperCase()}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="table-cell text-sm border-b border-zinc-750 px-6 py-4 align-top">
                            ₹{transaction.price.toLocaleString("en-IN")}
                          </div>
                          <div className="table-cell text-sm border-b border-zinc-750 px-6 py-4 align-top">
                            {Number.isInteger(transaction.quantity)
                              ? Math.abs(transaction.quantity)
                              : formatFloat(transaction.quantity, 3)}
                            {` ${transaction.symbol.toUpperCase()}`}
                          </div>
                          <div className="table-cell text-sm border-b border-zinc-750 px-6 py-4 align-top">
                            <p className="font-medium">
                              {Number.isInteger(totalValue)
                                ? transaction.quantity > 0
                                  ? `-${totalValue}`
                                  : `+${totalValue * -1}`
                                : transaction.quantity > 0
                                ? `-${formatFloat(totalValue, 2)}`
                                : `+${formatFloat(totalValue * -1, 2)}`}
                              INR
                            </p>
                          </div>
                          <div className="table-cell text-sm border-b border-zinc-750 px-6 py-4 align-top text-right">
                            {transaction.quantity > 0 ? (
                              <p>
                                <span className="font-medium">Bought</span>{" "}
                                {formatDateTime(1, transaction.txn_timestamp)}
                              </p>
                            ) : (
                              <p>
                                <span className="font-medium">Sold</span>{" "}
                                {formatDateTime(1, transaction.txn_timestamp)}
                              </p>
                            )}
                            <p className="text-zinc-400 whitespace-nowrap">
                              {formatDateTime(2, transaction.txn_timestamp)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default transactions;
