"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";

interface Category {
  id: string;
  name: string;
  image: string;
  tag: string;
}

const CATEGORIES: Category[] = [
  { 
    id: "news", 
    name: "News", 
    tag: "News",
    image: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?q=80&w=800&auto=format&fit=crop" 
  },
  { 
    id: "stories", 
    name: "Stories", 
    tag: "Story",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop" 
  },
  { 
    id: "data", 
    name: "Data", 
    tag: "Data",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop" 
  },
  { 
    id: "ai", 
    name: "AI", 
    tag: "AI",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=800&auto=format&fit=crop" 
  },
  { 
    id: "infra", 
    name: "Infrastructure", 
    tag: "DevOps", 
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800&auto=format&fit=crop" 
  },
  { 
    id: "blog", 
    name: "Blog", 
    tag: "Blog",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=800&auto=format&fit=crop" 
  },
];

interface BlogCategoryListProps {
  onSelectCategory: (tag: string) => void;
  activeCategory: string;
}

export function BlogCategoryList({ onSelectCategory, activeCategory }: BlogCategoryListProps) {
  const scrollContainer = useRef<HTMLDivElement>(null);

  return (
    <div className="mb-12">
      <div 
        ref={scrollContainer}
        className="flex gap-4 overflow-x-auto pb-4 -mx-6 pl-8 pr-6 md:mx-0 md:px-0 scrollbar-hide snap-x"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.tag)}
            className={`
              relative group shrink-0 w-64 md:w-72 aspect-[16/10] rounded-2xl overflow-hidden snap-start text-left focus:outline-none focus:ring-2 focus:ring-primary
              ${activeCategory === cat.tag ? 'ring-2 ring-primary' : ''}
            `}
          >
            {/* Background Image */}
            <div className="absolute inset-0">
               <img 
                 src={cat.image} 
                 alt={cat.name} 
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-90" />
            </div>

            {/* Content */}
            <div className="absolute inset-0 p-5 flex flex-col justify-end">
               <div className="flex justify-between items-end">
                  <span className="text-xl font-bold text-white tracking-wide">
                    {cat.name}
                  </span>
                  
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center 
                    transition-colors duration-300
                    ${activeCategory === cat.tag ? 'bg-primary text-primary-foreground' : 'bg-white/20 text-white group-hover:bg-white group-hover:text-black'}
                  `}>
                    <Plus className="w-4 h-4" />
                  </div>
               </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
