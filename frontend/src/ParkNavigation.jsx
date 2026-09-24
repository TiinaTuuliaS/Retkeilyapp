import { useEffect, useId, useRef, useState } from 'react';

export default function ParkNavigation({ parks, selectedSlug }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const toggle = useRef(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const outside = event => {
      if (!root.current?.contains(event.target)) setOpen(false);
    };
    const escape = event => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return <nav className="park-nav" aria-label="Päänavigaatio">
    <a className="nav-home" href="#/" aria-current={!selectedSlug ? 'page' : undefined}>Kaikki kohteet</a>
    <div className="park-dropdown" ref={root} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button className="park-toggle" type="button" ref={toggle} aria-expanded={open} aria-controls={listId} onClick={() => setOpen(value => !value)}>
        Kansallispuistot <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      <ul className="park-menu" id={listId} hidden={!open}>
        {parks.map(park => <li key={park.slug}>
          <a href={`#/parks/${park.slug}`} aria-current={selectedSlug === park.slug ? 'page' : undefined} onClick={() => {
            setOpen(false);
            toggle.current?.focus();
          }}>{park.name}{selectedSlug === park.slug && <span aria-hidden="true"> ✓</span>}</a>
        </li>)}
        {!parks.length && <li className="park-menu-empty">Ei kansallispuistoja saatavilla.</li>}
      </ul>
    </div>
  </nav>;
}
