"use client";

import { Calendar, Lightbulb, PenTool, Bug, Sword, Shield } from "lucide-react";
import RadialOrbitalTimeline from "./radial-orbital-timeline";

const timelineData = [
  {
    id: 1,
    title: "Planning",
    date: "Winter",
    content:
      '"You know nothing, Jon Snow." - Beginning the project with careful planning and gathering requirements from the kingdoms.',
    category: "Planning",
    icon: Calendar,
    relatedIds: [2],
    status: "completed" as const,
    energy: 100,
  },
  {
    id: 2,
    title: "Brainstorming",
    date: "Winter",
    content:
      '"When you play the game of thrones, you win or you die." - Exploring ideas and strategies, considering all possible paths to victory.',
    category: "Brainstorming",
    icon: Lightbulb,
    relatedIds: [1, 3],
    status: "completed" as const,
    energy: 90,
  },
  {
    id: 3,
    title: "Design",
    date: "Spring",
    content:
      "\"Chaos isn't a pit. Chaos is a ladder.\" - Creating the architecture and blueprints that will shape our project's destiny.",
    category: "Design",
    icon: PenTool,
    relatedIds: [2, 4, 5],
    status: "in-progress" as const,
    energy: 75,
  },
  {
    id: 4,
    title: "Debugging",
    date: "Summer",
    content:
      '"Valar Morghulis - All men must die. But we are not men." - Hunting down bugs and ensuring the project stands strong against all threats.',
    category: "Debugging",
    icon: Bug,
    relatedIds: [3, 6],
    status: "in-progress" as const,
    energy: 60,
  },
  {
    id: 5,
    title: "Battle",
    date: "Fall",
    content:
      '"Dracarys!" - Fighting through the toughest challenges with fire and determination, confronting the project\'s biggest obstacles.',
    category: "Challenge",
    icon: Sword,
    relatedIds: [3, 6],
    status: "pending" as const,
    energy: 40,
  },
  {
    id: 6,
    title: "Victory",
    date: "Winter is Coming",
    content:
      '"The North Remembers" - Final deployment and conquest, establishing our project\'s rule over the digital realm.',
    category: "Release",
    icon: Shield,
    relatedIds: [4, 5],
    status: "pending" as const,
    energy: 20,
  },
];

export function Orbit() {
  return (
    <>
      <RadialOrbitalTimeline timelineData={timelineData} />
    </>
  );
}
