import { Navbar } from "@/components/cognito/Navbar"
import { WaterShaderBackground } from "@/components/ui/water-shader-background"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <WaterShaderBackground />
      </div>
      <div className="relative z-10">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
