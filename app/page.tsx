import { EmotionDetector } from '@/components/EmotionDetector';
import Link from 'next/link';

export const metadata = {
  title: 'Emoji Emotion Detector',
  description: 'Take a snapshot and see your emotion turned into an emoji!',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Emoji Photo Booth
          </h1>
          <p className="text-lg text-slate-600">
            Take a snap and see your expressions match with an emoji!
          </p>
        </div>


        <div className="flex justify-center mb-12">
          <Link href="/challenge" className="relative group inline-flex items-center justify-center">
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
            <button className="relative px-8 py-4 bg-white ring-1 ring-slate-900/5 rounded-full leading-none flex items-center gap-3">
              <span className="text-2xl">🎮</span>
              <span className="text-slate-900 font-bold text-lg">Play Reaction Challenge</span>
            </button>
          </Link>
        </div>

        {/* Main Component */}

        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-100">
          <EmotionDetector />
        </div>

        {/* Info Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
            <p className="text-3xl mb-2">📸</p>
            <h3 className="font-semibold text-slate-900 mb-2">Take a Snap</h3>
            <p className="text-sm text-slate-600">
              Use the live camera preview to frame your shot, then capture!
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
            <p className="text-3xl mb-2">🤖</p>
            <h3 className="font-semibold text-slate-900 mb-2">AI Detection</h3>
            <p className="text-sm text-slate-600">
              Our model detects 7 different emotions and assigns the perfect emoji.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
            <p className="text-3xl mb-2">🔒</p>
            <h3 className="font-semibold text-slate-900 mb-2">100% Private</h3>
            <p className="text-sm text-slate-600">
              Everything runs locally in your browser. No photos are uploaded.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-slate-500">
          <p>✨ Try different expressions: happy, sad, angry, surprised, disgusted, or fearful!</p>
        </div>
      </div>
    </main>
  );
}
