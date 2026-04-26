import { useEffect, useState } from 'react';

function App() {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/locations')
      .then(res => res.json())
      .then(data => setLocations(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>Retkeilykohteet</h1>

      {locations.length === 0 ? (
        <p>Ei vielä dataa...</p>
      ) : (
        locations.map(loc => (
          <div key={loc.id}>
            <h3>{loc.name}</h3>
            <p>{loc.type}</p>
            <p>{loc.description}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default App;
