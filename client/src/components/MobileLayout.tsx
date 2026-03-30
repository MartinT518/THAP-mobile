import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { cn } from "@/lib/utils";

interface MobileLayoutProps {
  children: ReactNode;
  showBottomNav?: boolean;
  className?: string;
}

export function MobileLayout({ children, showBottomNav = true, className }: MobileLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main
        id="main-content"
        className={cn("flex-1 pb-20", !showBottomNav && "pb-0", className)}
      >
        {children}
      </main>
      {showBottomNav && <BottomNav />}
    </div>
  );
}
