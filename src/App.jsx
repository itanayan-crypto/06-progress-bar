import { useEffect } from "react";
import ProgressBar from "./components/ProgressBar/ProgressBar.jsx";

// body[data-task] is used by styles/base.css for this task's page background.
const TASK_ID = "6";

export default function App() {
  useEffect(() => {
    document.body.dataset.task = TASK_ID;
    return () => { delete document.body.dataset.task; };
  }, []);

  return (
    <main className="page">
      <div className="page-head">
        <span className="task-chip">Task 6</span>
        <h1 className="page-title">Task Progress Bar</h1>
        <p className="page-sub">Shows task completion in percent. 100% means the task is successfully completed.</p>
      </div>
      <ProgressBar />
    </main>
  );
}
