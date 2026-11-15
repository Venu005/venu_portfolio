import SmoothScroll from "@/components/site/SmoothScroll";
import Loader from "@/components/site/Loader";
import Nav from "@/components/site/Nav";
import Hero from "@/sections/Hero";
import Message from "@/sections/Message";
import About from "@/sections/About";
import Tracks from "@/sections/Tracks";
import Experience from "@/sections/Experience";
import Work from "@/sections/Work";
import Services from "@/sections/Services";
import Skills from "@/sections/Skills";
import Contact from "@/sections/Contact";
import Footer from "@/sections/Footer";

export default function Home() {
  return (
    <SmoothScroll>
      <Loader />
      <Nav />
      <main>
        <Hero />
        <Message />
        <About />
        <Tracks />
        <Experience />
        <Work />
        <Services />
        <Skills />
        <Contact />
      </main>
      <Footer />
    </SmoothScroll>
  );
}
