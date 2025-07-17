import { OrbitDialogue } from "@/components/extra/planning/OrbitDialogue";
import "../../animations/animate.css";
import AnimatedBody from "../../animations/AnimatedBody";
import AnimatedTitle from "../../animations/AnimatedTitle";

const About = () => {
  return (
    <section
      className="relative z-10 w-full items-center justify-center overflow-hidden bg-[#0E1016] bg-cover bg-center pt-16 pb-16 md:pt-20 md:pb-16 lg:pt-20 lg:pb-16"
      id="about"
    >
      <div className="mx-auto flex w-[90%] flex-col items-center justify-center lg:max-w-[1212.8px]">
        <AnimatedTitle
          text={
            "I MAKE SOFTWARES THAT WORKS FOR YOU, NOT THE OTHER WAY AROUND..."
          }
          className={
            "mb-10 text-left text-[40px] font-bold leading-[0.9em] tracking-tighter text-[#e4ded7] sm:text-[45px] md:mb-16 md:text-[60px] lg:text-[80px]"
          }
          wordSpace={"mr-[14px]"}
          charSpace={"mr-[0.001em]"}
        />

        <div className="mx-auto flex w-[100%] flex-col lg:max-w-[1200px] lg:flex-row lg:gap-20">
          <div className="mb-10 flex w-[100%] flex-col gap-4 text-[18px] font-medium leading-relaxed tracking-wide text-[#e4ded7] md:mb-16 md:gap-6 md:text-[20px] md:leading-relaxed lg:mb-16 lg:max-w-[90%] lg:text-[24px]">
            <AnimatedBody
              text={
                "I am a performance-driven Computer Science student and Software Engineer with hands-on experience building scalable backend systems and AI-powered applications. I've developed production systems supporting 10K+ users and achieved 60% database performance improvements through optimized MongoDB queries."
              }
            />
            <AnimatedBody
              text={
                "Beyond coding I hit the gym and enjoy reading books, I watch anime, movies and series, My favourite picks are Game of thrones,Naruto, Salaar"
              }
            />
          </div>

          <div className="mb-24 flex w-[100%] flex-col gap-4 text-[18px] font-normal leading-relaxed tracking-wide text-[#e4ded7]/80 sm:mb-32 md:mb-40 md:gap-6 md:text-[16px] md:leading-normal lg:mt-0 lg:mb-16 lg:max-w-[30%] lg:text-[18px]">
            <div className="flex flex-col gap-4 md:gap-3">
              <AnimatedTitle
                text={"Frontend Core"}
                className="text-[24px] text-[#e4ded7] md:text-[30px] lg:text-[20px]"
                wordSpace="mr-[0.25em]"
                charSpace="mr-[0.01em]"
              />
              <AnimatedBody text="React, Next.js, TypeScript, Redux, Framer Motion, WebSockets, Liveblocks" />
            </div>
            <div className="flex flex-col gap-3">
              <AnimatedTitle
                text={"Backend & Database"}
                className="text-[24px] text-[#e4ded7] md:text-[30px] lg:text-[20px]"
                wordSpace="mr-[0.25em]"
                charSpace="mr-[0.01em]"
              />
              <AnimatedBody text="Node.js, Convex, Prisma, MongoDB, REST/GraphQL, Express.js" />
            </div>
            <div className="flex flex-col gap-3">
              <AnimatedTitle
                text={"Technologies & Cloud"}
                className="text-[24px] text-[#e4ded7] md:text-[30px] lg:text-[20px]"
                wordSpace="mr-[0.25em]"
                charSpace="mr-[0.01em]"
              />
              <AnimatedBody text="Kafka, Redis, Docker, Amazon Web Services" />
            </div>
            <OrbitDialogue />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
