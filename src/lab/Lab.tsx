import { Component, useEffect, useState, type ReactNode } from "react";
import { Chrome } from "./Chrome";
import { Stage } from "./Stage";

type BoundaryState = { error: string | null };

class Boundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error: error.message || "The laboratory view failed." };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-dvh items-center justify-center bg-bg px-6 text-center">
          <div>
            <p className="font-mono text-xs tracking-widest text-primary">NEUROTOME</p>
            <h1 className="mt-2 text-lg font-semibold">The optical stage failed</h1>
            <p className="mt-2 max-w-md text-sm text-muted">{this.state.error}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Boot() {
  return (
    <div className="flex h-dvh flex-col justify-between bg-bg px-4 py-4">
      <div>
        <p className="font-mono text-xs tracking-widest text-primary">NEUROTOME</p>
        <h1 className="mt-2 text-lg font-semibold">Living neuroanatomy laboratory</h1>
        <p className="mt-2 max-w-md text-sm text-muted">Preparing the sterile field and the reference specimen.</p>
      </div>
    </div>
  );
}

export function Lab() {
  const [live, setLive] = useState(false);
  useEffect(() => setLive(true), []);
  return (
    <main className="relative h-dvh overflow-hidden bg-bg text-fg">
      {live ? (
        <Boundary>
          <Stage />
          <Chrome />
        </Boundary>
      ) : (
        <Boot />
      )}
    </main>
  );
}
