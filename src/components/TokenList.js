import React, { useContext, useEffect, useState } from "react";
import UserContext from "../context/userContext";
import TokenItemList from "./TokenItemList";
import TokenContext from "../context/tokenContext";

const TokenList = ({ tokenList, watchlisted }) => {
  const { userData } = useContext(UserContext);
  const { tokens } = useContext(TokenContext);
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {tokenList && tokenList !== undefined && tokenList.length !== 0 ? (
        <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 my-4">
          <div className="pb-4 border border-zinc-750 rounded-lg overflow-x-auto">
            <div className="table w-full">
              <div className="table-header-group">
                <div className="table-row">
                  <div className="table-cell border-b dark:border-zinc-750 text-xs font-medium p-4 py-2 text-slate-400 dark:text-zinc-500 text-left">
                    #
                  </div>
                  <div className="table-cell border-b border-x dark:border-zinc-750 text-xs font-medium p-4 py-2 text-slate-400 dark:text-zinc-500 text-left bg-background md:bg-inherit md:border-x-0 sticky left-0 md:static">
                    Name
                  </div>
                  <div className="table-cell border-b dark:border-zinc-750 text-xs font-medium p-4 py-2 text-slate-400 dark:text-zinc-500 text-left">
                    Price
                  </div>
                  <div className="table-cell border-b dark:border-zinc-750 text-xs font-medium p-4 py-2 text-slate-400 dark:text-zinc-500 text-left">
                    24h %
                  </div>
                  <div className="table-cell border-b dark:border-zinc-750 text-xs font-medium p-4 py-2 text-slate-400 dark:text-zinc-500 text-left">
                    Market Cap
                  </div>
                  <div className="table-cell border-b dark:border-zinc-750 text-xs font-medium p-4 py-2 text-slate-400 dark:text-zinc-500 text-left"></div>
                </div>
              </div>

              {/* <div className="table-row-group">
                {tokenList &&
                  tokenList.pages.map((page) => {
                    
                    return page.map((token) => {
                      console.log("token-", token);
                      return (
                        <TokenItemList
                          token={token}
                          userData={userData}
                          key={token.id}
                        />
                      );
                    });
                  })}
              </div> */}

              <div className="table-row-group">
                {tokenList &&
                  tokenList.map((token) => (
                    <TokenItemList
                      token={token}
                      userData={userData}
                      key={token.id}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        watchlisted && (
          <div className="mx-auto max-w-7xl my-10 px-2 text-zinc-200 sm:px-6 lg:px-8">
            <p className="text-center py-8">Your Watch List is empty.</p>
          </div>
        )
      )}
    </>
  );
};

export default TokenList;
