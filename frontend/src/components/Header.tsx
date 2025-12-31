import Search from "./Search";

export default function Header() {
  return (
    <header className="flex justify-between items-center p-8 gap-3 bg-transparent border-b border-night-border z-10">
      <Search />

      <div className="flex items-center gap-4"></div>
    </header>
  );
}
