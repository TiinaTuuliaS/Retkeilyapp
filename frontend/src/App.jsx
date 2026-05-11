import { useEffect, useState } from 'react';
import './App.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

function App() {
  const [reports, setReports] = useState([]);
  const [locations, setLocations] = useState([]);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('ok');

  useEffect(() => {
    fetch('http://localhost:3000/reports')
      .then(res => res.json())
      .then(data => setReports(data));
  }, []);

  useEffect(() => {
    fetch('http://localhost:3000/locations')
      .then(res => res.json())
      .then(data => setLocations(data));
  }, []);

  const handleSubmit = async () => {
  const newReport = {
    location: { id: 1 },
    user_id: 1,
    status,
    comment,
  };

  const response = await fetch('http://localhost:3000/reports', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(newReport),
  });

  const data = await response.json();

  setReports([...reports, data]);

  setComment('');
  setStatus('ok');
};

console.log(locations);

  return (
    <div className="container">
      <h1>📍 Retkiraportit</h1>
<MapContainer
  center={[60.3139, 24.5147]}
  zoom={10}
  style={{ height: '400px', width: '100%', marginBottom: '20px' }}
>
  <TileLayer
    attribution='&copy; OpenStreetMap contributors'
    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
  />

  {locations
    .filter(loc => loc.latitude && loc.longitude)
    .map(loc => (
      <Marker
        key={loc.id}
        position={[loc.latitude, loc.longitude]}
      >
        <Popup>
          <strong>{loc.name}</strong>
          <br />
          {loc.description}
        </Popup>
      </Marker>
    ))}
</MapContainer>
      <div className="form">
  <textarea
    placeholder="Kirjoita raportti..."
    value={comment}
    onChange={(e) => setComment(e.target.value)}
  />

  <select
    value={status}
    onChange={(e) => setStatus(e.target.value)}
  >
    <option value="ok">Kunnossa</option>
    <option value="not_ok">Ei kunnossa</option>
  </select>

  <button onClick={handleSubmit}>Lähetä raportti</button>
</div>

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
