import { useCallback, useEffect, useState } from 'react';
import Home from './screens/Home';
import Research from './screens/Research';
import Lab from './screens/Lab';
import History from './screens/History';
import Settings from './screens/Settings';
import ScriptInput from './screens/ScriptInput';
import { getProject, newProjectId, saveProject } from './lib/db';
import { getCategory } from './lib/categories';
import type { CategoryId, Project } from './lib/types';

export type Tab = 'home' | 'research' | 'script' | 'lab' | 'history' | 'settings';
const TABS: Array<{ id: Tab; icon: string; label: string }> = [
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'research', icon: '🔎', label: 'Research' },
  { id: 'script', icon: '📝', label: 'Script' },
  { id: 'lab', icon: '🧪', label: 'Lab' },
  { id: 'history', icon: '🗂️', label: 'Projects' },
  { id: 'settings', icon: '⚙️', label: 'Settings' }
];

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('divriz.current');
    if (id) getProject(id).then((p) => p && setProject(p)).catch(() => {});
  }, []);

  const update = useCallback(async (p: Project) => {
    setProject(p);
    localStorage.setItem('divriz.current', p.id);
    await saveProject(p);
  }, []);

  const startProject = async (cat: CategoryId) => {
    const c = getCategory(cat);
    const p: Project = { id: newProjectId(), title: `${c.label} project`, category: cat, createdAt: Date.now(), updatedAt: Date.now(), stage: 'news' };
    await update(p);
    setTab('research');
  };

  const newOwnProject = async (): Promise<Project> => {
    const p: Project = { id: newProjectId(), title: 'Meri script', category: 'other', createdAt: Date.now(), updatedAt: Date.now(), stage: 'script-own', lang: 'hi', length: 'short', scriptSource: 'user' };
    await update(p);
    return p;
  };

  const openProject = (p: Project) => { setProject(p); localStorage.setItem('divriz.current', p.id); setTab('research'); };

  return (
    <div className="app">
      <header className="top"><span className="logo">DIVRIZ <b>AI</b></span><span className="sub">Research → Script → Voiceover → Motion → MP4</span></header>
      <main>
        {tab === 'home' && <Home onPick={startProject} onOwnScript={async () => { await newOwnProject(); setTab('script'); }} />}
        {tab === 'research' && <Research project={project} onUpdate={update} goHome={() => setTab('home')} />}
        {tab === 'script' && <ScriptInput project={project} onUpdate={update} onNew={newOwnProject} />}
        {tab === 'lab' && <Lab />}
        {tab === 'history' && <History current={project?.id} onOpen={openProject} />}
        {tab === 'settings' && <Settings />}
      </main>
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
