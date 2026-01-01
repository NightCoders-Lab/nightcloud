export default function formatDate(dateString: string) {
  const date = new Date(dateString);
  const arrange = date.toLocaleDateString("en-US", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${arrange} ${time}`;
}
