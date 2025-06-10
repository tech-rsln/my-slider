"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Icon from "@/assets/vercel.svg";

interface Account {
  login: string;
}

const HeaderContainer = () => {
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/account", {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("hwms_token")}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        setAccount(res);
      })
      .catch((error) => {
        setError(error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (error) {
    return <div className="text-red-500">Error: {error.message}</div>;
  }

  if (loading) {
    return <div className="text-gray-500">Loading...</div>;
  }

  return (
    <div className="container mx-auto flex justify-between items-center">
      <div className="flex items-center gap-4">
        <Image src={Icon} alt="logo" width={20} height={20} />
        <a className="text-lg font-bold">Slide Builder</a>
      </div>
      <div className="inline-flex items-center justify-center w-10 h-10 text-xl text-white bg-indigo-500 rounded-full">
        {account?.login.charAt(0).toUpperCase()}
      </div>
    </div>
  );
};

export default HeaderContainer;
