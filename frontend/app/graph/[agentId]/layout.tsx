import { Navbar } from "@/components/cognito/Navbar"

export default function GraphLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-[#080808] relative overflow-hidden">
      {/* Dot grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff18 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="relative z-10 h-full flex flex-col">
        <Navbar />
        {children}
      </div>
    </div>
  )
}
