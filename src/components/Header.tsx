
import Link from 'next/link';
import { Flame, Sparkles } from 'lucide-react'; // Added Sparkles
import { SidebarTrigger } from '@/components/ui/sidebar'; 

export default function Header() {
  return (
    <header className="bg-background/90 backdrop-blur-md sticky top-0 z-40 border-b shadow-sm">
      <div className="container mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <SidebarTrigger className="md:hidden mr-1 sm:mr-2 text-primary hover:text-primary/80" />
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
            {/* Using Sparkles for a more playful header icon */}
            <Sparkles className="h-7 w-7 sm:h-9 sm:w-9 text-accent transition-transform group-hover:scale-110 group-hover:rotate-[15deg]" /> 
            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary group-hover:text-primary/80 transition-colors text-shadow-playful">
              Meeryn-Bee
            </h1>
          </Link>
        </div>
      </div>
    </header>
  );
}
