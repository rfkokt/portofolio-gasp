export function Footer() {
    return (
      <footer className="w-full py-8 mt-20 border-t border-white/5 bg-black/20 backdrop-blur-lg relative z-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-zinc-500">
            <span className="text-zinc-300 font-semibold">Rifki Oktapratama</span> — Creative Frontend Developer
          </div>
          
          <div className="flex items-center gap-6 text-sm text-zinc-500 font-mono uppercase tracking-wider">
            <a href="#" className="hover:text-orange-400 transition-colors">GitHub</a>
            <a href="#" className="hover:text-orange-400 transition-colors">Twitter</a>
            <a href="#" className="hover:text-orange-400 transition-colors">LinkedIn</a>
          </div>
  
          <div className="text-xs text-zinc-600">
            © {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    );
  }
