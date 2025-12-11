import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6">
      {/* Giant 404 */}
      <h1 className="text-[20vw] font-black leading-none tracking-tighter text-foreground opacity-10 select-none">
        404
      </h1>
      
      {/* Overlay Content */}
      <div className="absolute flex flex-col items-center gap-6">
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          // PAGE NOT FOUND
        </p>
        <h2 className="text-3xl md:text-5xl font-bold text-foreground">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-muted-foreground max-w-md">
          Maaf, halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>
        <Link 
          href="/"
          className="mt-4 px-8 py-3 bg-foreground text-background font-bold text-sm uppercase tracking-widest hover:bg-muted-foreground transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}
