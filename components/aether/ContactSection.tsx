"use client";

import { LucideIcon, Mail, Twitter, Linkedin, MessageSquare } from "lucide-react";

export function ContactSection() {
  return (
    <section id="contact" className="min-h-[50vh] flex flex-col items-center justify-center relative border-t border-[#222] bg-black">
      <div className="section-label">[ 05. SATELLITE UPLINK ]</div>
      
      <div className="w-full max-w-2xl px-6 relative z-10">
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-12 text-center">
            
            <div className="mb-8 flex justify-center">
                 <div className="inline-flex items-center gap-2 bg-white/5 text-zinc-400 px-4 py-2 rounded-full font-mono text-sm border border-white/10">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-400"></span>
                    </span>
                    @rdev.cloud
                 </div>
            </div>

            <h3 className="text-2xl font-bold mb-2 text-white">Also follow me on other social media!</h3>
            <p className="text-zinc-500 mb-8 text-sm">Open frequencies.</p>

            <div className="flex flex-col gap-4">
                 <div className="flex gap-4 justify-center">
                     <SocialButton icon={Linkedin} label="LinkedIn" href="#" />
                     <SocialButton icon={Twitter} label="X (Twitter)" href="#" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                     <iframe className="hidden" name="hidden_iframe" style={{display: 'none'}}></iframe>
                      <a href="mailto:contact@rdev.cloud" className="bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-bold">
                          <Mail size={16} /> Email me!
                      </a>
                      <a href="#" className="bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-white py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-bold">
                          <MessageSquare size={16} /> WhatsApp
                      </a>
                 </div>
            </div>

        </div>
      </div>

    </section>
  );
}

function SocialButton({ icon: Icon, label, href }: { icon: LucideIcon, label: string, href: string }) {
    return (
        <a href={href} className="bg-white/5 border border-white/10 text-white px-6 py-2 rounded-lg flex items-center gap-2 text-xs font-bold hover:bg-white/10 transition-colors">
            <Icon size={14} /> {label}
        </a>
    );
}
