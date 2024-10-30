import Link from "next/link";
import React, { useContext, useEffect, useState } from "react";
import WatchList from "./WatchList";
import Image from "next/image";
import TokenContext from "../context/tokenContext";

const TokenItemList = ({ token, userData }) => {
  const tokenUrl = `coins/${token.id}`;

  return (
    <Link
      href={tokenUrl}
      className="table-row rounded-md hover:bg-zinc-800 text-white"
    >
      <div className="table-cell align-middle border-b border-zinc-750 dark:border-zinc-750 p-3">
        {token.market_cap_rank}
      </div>
      <div className="table-cell align-middle pr-6 border-b border-x bg-background md:bg-inherit md:border-x-0 sticky left-0 md:static border-zinc-750 dark:border-zinc-750 p-3">
        <div className="flex items-center w-max">
          <Image
            loader={() => token.image}
            unoptimized={true}
            height={32}
            width={32}
            src={token.image}
            alt={token.name}
            className="self-center w-8 h-8 rounded-full mx-1"
          />
          <div className="flex flex-col md:flex-row">
            <p className="ms-2 font-medium">{token.name}</p>
            <p className="ms-2 font-base text-zinc-400">
              {token.symbol.toUpperCase()}
            </p>
          </div>
        </div>
      </div>
      <div className="table-cell align-middle text-sm font-medium border-b border-zinc-750 dark:border-zinc-750 p-3">
        <div>₹{token.current_price.toLocaleString("en-IN")}</div>
      </div>
      <div className="table-cell align-middle text-sm border-b border-zinc-750 dark:border-zinc-750 p-3">
        <span
          className={`text-xs font-medium px-3 py-1 rounded-full ${
            token.price_change_percentage_24h > 0
              ? "border border-green-300 text-green-300"
              : "border border-red-400 text-red-400"
          }`}
        >
          {token.price_change_percentage_24h.toFixed(3)}%
        </span>
      </div>
      <div className="table-cell align-middle text-sm border-b border-zinc-750 dark:border-zinc-750 p-3">
        ₹{token.market_cap.toLocaleString("en-IN")}
      </div>
      <div className="table-cell align-middle text-sm text-end border-b border-zinc-750 dark:border-zinc-750 p-3">
        {userData ? (
          <WatchList token_id={token.id} isWatchlisted={token.iswatchlisted} />
        ) : (
          <WatchList token_id={false} isWatchlisted={token.iswatchlisted} />
        )}
        {/* <div id="tooltip-no-arrow" role="tooltip" class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                Tooltip content
            </div>  */}
      </div>
    </Link>
  );
};

export default TokenItemList;
