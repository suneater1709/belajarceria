import React from 'react';
import AppIcon from './AppIcon';
import { Award } from 'lucide-react';

export default function BadgeIcon({ icon, className = 'w-6 h-6 text-amber-500', emojiSize = 'text-2xl' }) {
    return <AppIcon icon={icon} className={className} emojiSize={emojiSize} fallback={Award} />;
}

