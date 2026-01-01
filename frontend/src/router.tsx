import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import RootView from "@/views/RootView";
import DirectoryView from "@/views/DirectoryView";
import TrashView from "./views/TrashView";

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<RootView />} index />
          <Route path="/directory/:nodeId" element={<DirectoryView />} />
          <Route path="/trash" element={<TrashView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
