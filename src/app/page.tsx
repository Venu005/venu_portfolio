"use client";
import useBlobity from "blobity/lib/react/useBlobity";
import Hero from "../sections/Hero/page";
import NavBar from "@/components/NavBar";
import { blobOptions } from "@/lib/BlobConfig";
import { useEffect } from "react";
import Footer from "@/sections/Footer/page";
import Contact from "@/sections/Contact/page";
import About from "@/sections/About/page";

import Projects from "@/sections/Projects/page";
import PreLoader from "@/animations/PreLoader/PreLoader";

export default function Home() {
  const blobityInstance = useBlobity(blobOptions);
  useEffect(() => {
    if (blobityInstance.current) {
      //@ts-ignore
      window.blobity = blobityInstance.current;
    }
  }, [blobityInstance]);
  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
    });
  }, []);
  return (
    <>
      <PreLoader />
      <NavBar />
      <main className="bg-black/[0.96] flex flex-col items-center overflow-hidden justify-center ">
        <Hero />
        <About />
        <Projects />
        <Contact />
        <Footer />
      </main>
    </>
  );
}
