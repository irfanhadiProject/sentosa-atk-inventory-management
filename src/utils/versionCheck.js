export const isNewerVersion = (latest, current) => {
  const l = latest.split(".").map(v => parseInt(v) || 0);
  const c = current.split(".").map(v => parseInt(v) || 0);

  const len = Math.max(l.length, c.length);

  for (let i = 0; i < len; i++) {
    const lv = l[i] || 0;
    const cv = c[i] || 0;

    if (lv > cv) return true;
    if (lv < cv) return false;
  }

  return false;
};