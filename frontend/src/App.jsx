import { useEffect, useState } from 'react';
import './App.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

function App() {
  const [reports, setReports] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
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
    if (!selectedLocation) {
      alert('Valitse paikka kartalta ensin');
      return;
    }

    const newReport = {
      location: { id: selectedLocation.id },
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

  const groupedReports = locations.map(location => ({
    ...location,
    reports: reports.filter(
      report => report.location.id === location.id
    ),
  }));

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
              eventHandlers={{
                click: () => {
                  setSelectedLocation(loc);
                },
              }}
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
        <h2>
          {selectedLocation
            ? `Raportoi: ${selectedLocation.name}`
            : 'Valitse paikka kartalta'}
        </h2>

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

        <button onClick={handleSubmit}>
          Lähetä raportti
        </button>
      </div>

      <div className="grid">
        {groupedReports.map(location => (
          <div className="card" key={location.id}>
            <h2>📍 {location.name}</h2>

            <p>{location.description}</p>

            {location.reports.length === 0 ? (
              <p>Ei raportteja vielä</p>
            ) : (
              location.reports.map(report => (
                <div key={report.id}>
                  <p className={`status ${report.status}`}>
                    {report.status === 'ok'
                      ? '✅ Kunnossa'
                      : '❌ Ei kunnossa'}
                  </p>

                  <p>{report.comment}</p>

                  <hr />
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
