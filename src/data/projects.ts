export interface Project {
  name: string;
  githubLink: string;
  deployedLink: string;
  techStack: string[];
  description: string;
  image?: string;
}

const projects: Project[] = [
  {
    name: "CollabHub - A space to connect with teams and friends",
    githubLink: "https://github.com/Venu005/CollabHub",
    deployedLink: "https://collab-hub-flame.vercel.app/",
    techStack: ["Nextjs", "Convex", "Web-sockets"],
    description:
      "A platform to connect with teams and friends, collaborate on projects.",
    image: "/projects/project-1.png",
  },
  {
    name: "ExamFlow - Exam management made easy",
    githubLink: "https://github.com/Venu005/exam-management",
    deployedLink: "https://exam-management-three.vercel.app/",
    techStack: ["Next.js", "Groq cloud", "Prisma"],
    description:
      "An AI Powered app to effortlessly manage exam scheduling, seating arrangements, and student performance tracking.",
    image: "/projects/project-2.png", // Add your image path here
  },
  {
    name: "Resume Enhancer - Use AI to enhance your resumes",
    githubLink: "https://github.com/Venu005/student-resume-v2",
    deployedLink: "https://student-resume-v2.vercel.app/",
    techStack: ["React", "AI", "Vector databases", "Prisma"],
    description:
      "A platform for students to craft their resumes, and get help in career with the help of AI.",
    image: "/projects/project-3.png", // Add your image path here
  },
];

export default projects;
