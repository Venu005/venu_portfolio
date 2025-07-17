import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Github, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface ProjectCardProps {
  project: {
    name: string;
    githubLink: string;
    deployedLink: string;
    techStack: string[];
    description: string;
    image?: string;
  };
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Default placeholder image if none provided
  const imageUrl = project.image || "/placeholder-project.jpg";

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <motion.div
          className="relative w-full h-full bg-[#1A1C24] rounded-lg overflow-hidden transition-all duration-300 ease-in-out shadow-lg border border-[#e4ded7]/10 cursor-pointer"
          onClick={() => setIsDialogOpen(true)}
          whileHover={{ y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {/* Project Image */}
          <div className="w-full h-full absolute inset-0 overflow-hidden">
            <Image
              src={imageUrl}
              alt={project.name}
              fill
              className="object-cover"
            />
          </div>
        </motion.div>
      </DialogTrigger>

      {/* Project Details Dialog */}
      <DialogContent className="sm:max-w-[500px] bg-[#1A1C24] border-[#e4ded7]/20 text-[#e4ded7]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold text-[#e4ded7]">
            {project.name}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#e4ded7]/80">
            {project.description}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          <Card className="bg-[#0E1016] border-[#e4ded7]/10 text-[#e4ded7]">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-base text-[#e4ded7]">
                Project Image
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="w-full overflow-hidden rounded-md">
                <Link href={project.deployedLink} className="cursor-pointer">
                  <div className="relative w-full h-48">
                    <Image
                      src={imageUrl}
                      alt={project.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 100vw, 500px"
                    />
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0E1016] border-[#e4ded7]/10 text-[#e4ded7]">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-base text-[#e4ded7]">
                Tech Stack
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-[#1A1C24] text-[#e4ded7]/80 text-xs rounded-md"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <CardFooter className="flex justify-between p-0 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="w-[48%] border-[#e4ded7]/20 text-[#0E1016] hover:bg-[#e4ded7] hover:text-[#0E1016]"
              asChild
            >
              <Link
                href={project.githubLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                View Code
              </Link>
            </Button>

            {project.deployedLink && (
              <Button
                variant="default"
                size="sm"
                className="w-[48%] bg-[#e4ded7] text-[#0E1016] hover:bg-[#e4ded7]/80"
                asChild
              >
                <Link
                  href={project.deployedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Live Demo
                </Link>
              </Button>
            )}
          </CardFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectCard;
