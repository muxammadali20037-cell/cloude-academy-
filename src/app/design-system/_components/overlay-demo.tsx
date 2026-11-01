"use client";

import { Info } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function TabsDemo() {
  return (
    <Tabs defaultValue="lesson" className="w-full max-w-md">
      <TabsList className="w-full">
        <TabsTrigger value="lesson">Dars</TabsTrigger>
        <TabsTrigger value="task">Topshiriq</TabsTrigger>
        <TabsTrigger value="mentor">Mentor</TabsTrigger>
      </TabsList>
      <TabsContent value="lesson" className="text-sm text-fg-muted">
        Mobil telefonda dars ekrani shu uchta tabga boʻlinadi.
      </TabsContent>
      <TabsContent value="task" className="text-sm text-fg-muted">
        Topshiriq sharti va javob maydoni shu yerda turadi.
      </TabsContent>
      <TabsContent value="mentor" className="text-sm text-fg-muted">
        AI mentor bilan suhbat 5-fazada ulanadi.
      </TabsContent>
    </Tabs>
  );
}

export function DialogDemo() {
  const [finished, setFinished] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Testni yakunlash</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Testni yakunlaysizmi?</DialogTitle>
          <DialogDescription>
            Yakunlagandan keyin javoblarni oʻzgartirib boʻlmaydi. 2 ta savolga hali javob
            bermagansiz.
          </DialogDescription>
          <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button variant="ghost">Davom etish</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button onClick={() => setFinished(true)}>Testni yakunlash</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
      {finished && (
        <p role="status" className="text-sm text-success">
          Test yakunlandi (namuna)
        </p>
      )}
    </div>
  );
}

export function TooltipDemo() {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="XP haqida">
            <Info aria-hidden />
          </Button>
        </TooltipTrigger>
        <TooltipContent>XP har bir toʻgʻri bajarilgan mashq uchun beriladi</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
