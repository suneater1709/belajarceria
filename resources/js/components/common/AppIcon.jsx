import React from 'react';
import {
    Award, Star, Calculator, Trophy, Crown, Target, Rocket,
    BookOpen, Palette, Gem, Sparkles, Medal, Flame, Zap, Heart,
    Shield, HelpCircle, Moon, Flag, Globe, FlaskConical, Compass,
    Hash, Plus, BookMarked, Music, Video, Smile, Trees, Sparkle,
    Layers, Users, CheckCircle, Book, Check, Play, Lightbulb
} from 'lucide-react';

const ICON_MAP = {
    // Modules & Topics
    'book-open': BookOpen,
    'books': BookOpen,
    'book': Book,
    'book-marked': BookMarked,
    'moon': Moon,
    'flag': Flag,
    'globe': Globe,
    'flask-conical': FlaskConical,
    'flask': FlaskConical,
    'compass': Compass,
    'calculator': Calculator,
    'sparkle': Sparkles,
    'sparkles': Sparkles,
    'hash': Hash,
    'plus': Plus,
    'palette': Palette,
    'star': Star,
    'award': Award,
    'trophy': Trophy,
    'crown': Crown,
    'target': Target,
    'rocket': Rocket,
    'gem': Gem,
    'medal': Medal,
    'flame': Flame,
    'zap': Zap,
    'heart': Heart,
    'shield': Shield,
    'help-circle': HelpCircle,
    'music': Music,
    'video': Video,
    'smile': Smile,
    'trees': Trees,
    'layers': Layers,
    'users': Users,
    'check-circle': CheckCircle,
    'check': Check,
    'play': Play,
    'lightbulb': Lightbulb,
};

// Deteksi karakter emoji Unicode
function isEmoji(str) {
    if (!str || typeof str !== 'string') return false;
    const emojiRegex = /(\p{Extended_Pictographic}|\p{Emoji_Presentation})/u;
    return emojiRegex.test(str.trim());
}

export default function AppIcon({ 
    icon, 
    className = 'w-6 h-6 text-current', 
    emojiSize = 'text-2xl',
    fallback: FallbackComponent = Star 
}) {
    if (!icon) {
        return <FallbackComponent className={className} />;
    }

    const trimmed = String(icon).trim();

    // Jika icon berupa emoji langsung (mis. 🌟, 📖, 🌙, 🐱, 🎖️)
    if (isEmoji(trimmed)) {
        return <span className={`select-none leading-none inline-flex items-center justify-center ${emojiSize}`}>{trimmed}</span>;
    }

    // Normalisasi string nama icon (lowercase, ganti spasi/underscore ke dash)
    const normalized = trimmed.toLowerCase().replace(/_/g, '-');
    const Component = ICON_MAP[normalized];

    if (Component) {
        return <Component className={className} />;
    }

    // Fallback jika tidak ditemukan
    return <FallbackComponent className={className} />;
}
