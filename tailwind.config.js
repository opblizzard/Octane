/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      colors: {
        octane: {
          bg: '#080c12',
          surface: '#0d1520',
          border: '#1a2a3a',
          muted: '#8fa3bc',
          accent: '#00f5ff',
          green: '#10b981',
          amber: '#f59e0b',
          red: '#ef4444',
          purple: '#a855f7',
          chaos0: '#00f5ff',
          chaos25: '#3b82f6',
          chaos50: '#a855f7',
          chaos75: '#f59e0b',
          chaos100: '#ef4444',
        },
      },
      animation: {
        'chaos-breathe': 'chaosBreathe 3s ease-in-out infinite',
        'entropy-flow': 'entropyFlow 2s linear infinite',
        scan: 'scan 4s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        chaosBreathe: {
          '0%,100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        },
        entropyFlow: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}
