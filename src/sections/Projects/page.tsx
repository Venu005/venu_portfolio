import React from "react";
import ProjectCard from "@/components/ProjectCard";
import projects from "@/data/projects";
import { motion } from "framer-motion";
import AnimatedTitle from "@/animations/AnimatedTitle";
import AnimatedBody from "@/animations/AnimatedBody";
import Folder from "@/components/extra/Folder/Folder";

const Projects = () => {
  // Create project cards for each project
  const projectCards = projects.map((project, index) => (
    <ProjectCard key={index} project={project} />
  ));

  return (
    <section
      id="projects"
      className="relative z-10 w-full items-center justify-center overflow-hidden bg-[#0E1016] bg-cover bg-center pb-36 md:pt-10 md:pb-24 lg:pt10 lg:pb-24"
    >
      <div className="mx-auto flex w-[90%] flex-col items-center justify-center lg:max-w-[1212.8px]">
        {/* Main content with left-right layout */}
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
          {/* Left side - Text content */}
          <div className="flex-1 flex flex-col items-start justify-center">
            <AnimatedTitle
              text={"MY PROJECTS"}
              className={
                "mb-10 text-left text-[40px] font-bold leading-[0.9em] tracking-tighter text-[#e4ded7] sm:text-[45px] md:mb-16 md:text-[60px] lg:text-[80px]"
              }
              wordSpace={"mr-[14px]"}
              charSpace={"mr-[0.001em]"}
            />

            <AnimatedBody
              text={
                "Here are some of fun projects I've worked on. Each project showcases my skills and experience in different technologies."
              }
              className={
                "text-[18px] font-medium leading-relaxed tracking-wide text-[#e4ded7] md:text-[20px] md:leading-relaxed lg:text-[24px]"
              }
            />
          </div>

          {/* Right side - Folder component */}
          <div className="flex-1 flex justify-center items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-[350px] h-[350px] flex items-center justify-center pt-24"
            >
              <Folder
                color="#f59d38"
                size={2.5}
                items={projectCards}
                className="transform-gpu"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;
