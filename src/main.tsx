import { createRoot } from "react-dom/client";
import { useState } from "react";
import App from "./App.tsx";
import { Preloader } from "./components/Preloader.tsx";
import "./index.css";

function Root() {
  const [ready, setReady] = useState(false);

  return (
    <>
      {!ready && <Preloader onComplete={() => setReady(true)} />}
      <div style={{ opacity: ready ? 1 : 0, transition: "opacity 0.3s ease" }}>
        <App />
      </div>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Root />);
