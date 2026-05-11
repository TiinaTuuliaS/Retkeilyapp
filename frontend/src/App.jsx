import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/reports')
      .then(res => res.json())
      .then(data => setReports(data));
  }, []);

  return (
    <div className="container">
      <h1>📍 Retkiraportit</h1>

      <div className="grid">
        {reports.map(report => (
          <div className="card" key={report.id}>
            <h3>{report.location.name}</h3>

            <p className={`status ${report.status}`}>
              {report.status === 'ok' ? '✅ Kunnossa' : '❌ Ei kunnossa'}
            </p>

            <p>{report.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
