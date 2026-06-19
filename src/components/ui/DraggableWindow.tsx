import React, { useState, useRef, useEffect } from 'react';
import { X, Database } from 'lucide-react';

interface DraggableWindowProps {
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
  width?: string;
  height?: string;
  icon?: React.ReactNode;
  zIndex?: string;
}

export default function DraggableWindow({ 
  title, 
  onClose, 
  children, 
  width = 'max-w-md', 
  height = 'auto',
  icon,
  zIndex = 'z-50'
}: DraggableWindowProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  // Center the window initially
  useEffect(() => {
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      const x = (window.innerWidth - rect.width) / 2;
      const y = (window.innerHeight - rect.height) / 2;
      setPosition({ x, y });
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.target instanceof Element && e.target.closest('button')) {
      return; // don't drag if clicking a button
    }
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    // Capture pointer to track outside window
    if (e.target instanceof Element) {
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    // Calculate new position
    let newX = e.clientX - dragStart.current.x;
    let newY = e.clientY - dragStart.current.y;
    
    // Basic bounds checking so it doesn't get completely lost
    if (windowRef.current) {
      const rect = windowRef.current.getBoundingClientRect();
      const margin = 30; // at least 30px visible
      if (newX > window.innerWidth - margin) newX = window.innerWidth - margin;
      if (newX + rect.width < margin) newX = margin - rect.width;
      if (newY > window.innerHeight - margin) newY = window.innerHeight - margin;
      if (newY < 0) newY = 0; // Don't allow going above top edge
    }

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (e.target instanceof Element) {
      e.target.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className={`fixed inset-0 pointer-events-none ${zIndex}`}>
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={onClose}></div>
      
      <div 
        ref={windowRef}
        className={`absolute flex flex-col bg-background border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 pointer-events-auto ${width}`}
        style={{ 
          left: position.x, 
          top: position.y,
          height: height === 'auto' ? 'auto' : height,
          opacity: position.x === 0 && position.y === 0 ? 0 : 1 // Hide until centered
        }}
      >
        {/* Title Bar (Draggable Area) */}
        <div 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="h-8 bg-gradient-to-b from-[#f5f6f7] to-[#e4e5e6] border-b border-border flex items-center justify-between px-3 shrink-0 select-none cursor-move"
        >
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-foreground font-medium flex items-center gap-2">
              {icon || <Database size={12} className="text-[#DC382D]" />} {title}
            </span>
          </div>
          {onClose && (
            <button 
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="p-1 hover:bg-[#e81123] hover:text-white rounded-sm transition-colors text-muted-foreground"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-card">
          {children}
        </div>
      </div>
    </div>
  );
}
