'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="rounded-2xl border border-white/[0.08] divide-y divide-white/[0.07] overflow-hidden">
      {items.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.question}>
            <button
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4.5 text-left hover:bg-white/[0.02] transition-colors"
            >
              <span className="text-[14px] font-medium ">{item.question}</span>
              <ChevronDown
                size={17}
                className={`shrink-0 text-[#8891B8] transition-transform duration-200 ${open ? 'rotate-180 ' : ''}`}
              />
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-200 ease-out"
              style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <p className="px-5 sm:px-6 pb-4.5 text-[13.5px] text-[#8891B8] leading-relaxed">{item.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}