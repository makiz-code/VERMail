export function getData(topics) {
  const labels = Object.keys(topics);
  const series = [Object.values(topics)];
  return { labels, series };
}
