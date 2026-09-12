function ringPosition([x,y], ring) {
  let inside = false;
  for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const [ax,ay]=ring[j], [bx,by]=ring[i];
    const dx=bx-ax, dy=by-ay, length=Math.hypot(dx,dy);
    if (length > 0 && Math.abs(dx*(y-ay)-dy*(x-ax))/length < 1e-9 &&
        x >= Math.min(ax,bx)-1e-9 && x <= Math.max(ax,bx)+1e-9 &&
        y >= Math.min(ay,by)-1e-9 && y <= Math.max(ay,by)+1e-9) return 2;
    if ((ay>y)!==(by>y) && x<(bx-ax)*(y-ay)/(by-ay)+ax) inside=!inside;
  }
  return inside ? 1 : 0;
}
function polygonPosition(point, rings) {
  const exterior=ringPosition(point,rings[0]);
  if (exterior!==1) return exterior;
  for (const hole of rings.slice(1)) {
    const position=ringPosition(point,hole);
    if (position===2) return 2;
    if (position===1) return 0;
  }
  return 1;
}

module.exports = {polygonPosition};
