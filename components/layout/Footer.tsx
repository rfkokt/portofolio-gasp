export function Footer() {
    return (
      <footer className="w-full py-8 mt-20 border-t border-border bg-background/20 backdrop-blur-lg relative z-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">Rifki Oktapratama</span> — Creative Frontend Developer
          </div>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground font-mono uppercase tracking-wider">
            <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
            <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
            <a href="#" className="hover:text-foreground transition-colors">LinkedIn</a>
          </div>
  
          <div className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    );
  }
