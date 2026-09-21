import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

class AppErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-slate-100">
        <section className="w-full max-w-xl rounded-2xl border border-red-400/30 bg-slate-900 p-6 shadow-2xl">
          <h1 className="text-2xl font-black text-red-200">遊戲啟動時發生問題</h1>
          <p className="mt-3 text-slate-300">請重新整理頁面；如果仍然無法開啟，請把以下錯誤訊息提供給開發者。</p>
          <pre className="mt-4 overflow-auto rounded-xl bg-black/40 p-4 text-xs text-red-100">{this.state.error?.message || String(this.state.error)}</pre>
        </section>
      </main>
    );
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);
