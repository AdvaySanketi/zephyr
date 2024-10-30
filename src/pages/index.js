import Navbar from "../components/Navbar";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push("/explore");
  }, []);

  return <></>;
}
