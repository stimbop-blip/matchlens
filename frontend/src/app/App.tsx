import { AppProviders } from "./providers";

export default function App() {
  return (
    <AppProviders>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--text-primary)",
          background: "var(--background)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        Mini App loaded
      </div>
    </AppProviders>
  );
}
