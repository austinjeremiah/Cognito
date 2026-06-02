import { Navbar } from "@/components/cognito/Navbar"
import { WaterShaderBackground } from "@/components/ui/water-shader-background"

export default function GraphLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <WaterShaderBackground />
      </div>
      <div className="relative z-10 h-full flex flex-col">
        <Navbar />
        {children}
      </div>
    </div>
  )
}
