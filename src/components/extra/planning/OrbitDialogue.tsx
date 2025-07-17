"use client";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Orbit } from "@/components/extra/planning/Orbit";
import { useState } from "react";
export const OrbitDialogue = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  return (
    <div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <div
            className="cursor-pointer text-[#e4ded7] transition-colors duration-200 underline  text-sm"
            onClick={() => setIsDialogOpen(true)}
          >
            (How I navigate my project building process)
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-4xl w-[90vw] overflow-auto bg-transparent border-none shadow-none p-0">
          <div>
            <Orbit />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
