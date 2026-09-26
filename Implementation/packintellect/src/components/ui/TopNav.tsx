import React from 'react';
import { AppStep } from '../../types/packaging';
import { sound } from '../../utils/audioFeedback';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';

interface TopNavProps {
  currentStep: AppStep;
  onNavigate: (step: AppStep) => void;
  isAudioMuted: boolean;
  onToggleAudio: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentStep,
  onNavigate,
  isAudioMuted,
  onToggleAudio,
}) => {
  const navItems: { step: AppStep; label: string }[] = [
    { step: 'intro', label: 'Overview' },
    { step: 'select', label: 'Food Select' },
    { step: 'inspect', label: '3D Studio' },
    { step: 'journey', label: 'Journey' },
    { step: 'testlab', label: 'Test Lab' },
    { step: 'redesign', label: 'Redesign' },
    { step: 'transform', label: 'V1 → V2' },
    { step: 'results', label: 'Results' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FAF9F5]/90 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => {
            sound.click();
            onNavigate('intro');
          }}
          className="text-left font-display font-bold text-xl tracking-tight text-stone-900 hover:text-stone-700 transition-colors cursor-pointer"
        >
          PackIntellect
        </button>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = currentStep === item.step;
            return (
              <button
                key={item.step}
                onClick={() => {
                  sound.click();
                  onNavigate(item.step);
                }}
                className={`text-xs font-medium transition-colors cursor-pointer py-1 relative whitespace-nowrap ${
                  isActive
                    ? 'text-stone-900 font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-900 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Primary action & audio feedback toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              onToggleAudio();
              sound.click();
            }}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              sound.click();
              onNavigate('select');
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium transition-all shadow-xs active:scale-98 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Engineer My Package</span>
          </button>
        </div>
      </div>
    </header>
  );
};
