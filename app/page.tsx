import { EmotionDetector } from '@/components/EmotionDetector';

export const metadata = {
  title: 'Emoji Emotion Detector',
  description: 'Real-time emotion detection with live emoji overlay',
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Emotion Detector
          </h1>
          <p className="text-lg text-slate-600">
            See your emotions come to life with AI-powered emoji overlays
          </p>
        </div>

        {/* Main Component */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-100">
          <EmotionDetector />
        </div>

        {/* Info Section */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-3xl mb-2">📹</p>
            <h3 className="font-semibold text-slate-900 mb-2">Real-time Camera</h3>
            <p className="text-sm text-slate-600">
              Your webcam stream processes entirely in your browser
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-3xl mb-2">🤖</p>
            <h3 className="font-semibold text-slate-900 mb-2">AI Detection</h3>
            <p className="text-sm text-slate-600">
              Face-api.js detects 7 different emotions with high accuracy
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-3xl mb-2">⚡</p>
            <h3 className="font-semibold text-slate-900 mb-2">Client-Side</h3>
            <p className="text-sm text-slate-600">
              Zero server cost, all processing happens in your browser
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm text-slate-600">
          <p>✨ Move your face around to see different emotions detected</p>
        </div>
      </div>
    </main>
  );
}
