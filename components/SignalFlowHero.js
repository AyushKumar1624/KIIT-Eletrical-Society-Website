"use client";

import { useEffect, useRef } from "react";

/**
 * SignalFlowHero
 * 
 * An elegant, performant electrical engineering visual for the KES Hero.
 * Renders orthogonal circuit traces, terminal nodes, and calm signal packet
 * propagation, reacting subtly to cursor movement and scroll position.
 * 
 * Design Principles:
 * - Real engineering aesthetic (warm brass, copper, deep laboratory green).
 * - No neon, no crypto/hacker glow, no random particles.
 * - 100% lightweight HTML5 2D Canvas (< 4KB, 0 dependencies).
 * - Full reduced-motion and mobile fallbacks.
 * - Pauses automatically when off-screen or in background tabs.
 */
export default function SignalFlowHero() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animId = null;
    let isVisible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Pointer state relative to canvas
    const pointer = { x: -1000, y: -1000, active: false };

    // Reduced motion check
    const isReducedMotion = () => {
      const root = document.documentElement;
      return (
        root.classList.contains("reduce-motion") ||
        (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches && !root.classList.contains("force-motion"))
      );
    };

    // Node & Trace Network
    let nodes = [];
    let segments = [];
    let signals = [];

    function buildNetwork(w, h, isMobile) {
      nodes = [];
      segments = [];
      signals = [];

      // Grid spacing: larger on mobile to simplify computation and visual density
      const stepX = isMobile ? Math.max(90, w / 6) : Math.max(120, w / 11);
      const stepY = isMobile ? Math.max(80, h / 7) : Math.max(90, h / 9);

      const cols = Math.floor(w / stepX);
      const rows = Math.floor(h / stepY);
      const startX = (w - cols * stepX) / 2;
      const startY = (h - rows * stepY) / 2;

      // Create grid of junction points
      const grid = [];
      for (let r = 0; r <= rows; r++) {
        grid[r] = [];
        for (let c = 0; c <= cols; c++) {
          const x = startX + c * stepX;
          const y = startY + r * stepY;
          const node = {
            id: `${r}-${c}`,
            x,
            y,
            pulse: 0,
            isEndpoint: false,
            connections: [],
            adjacentSegments: [],
          };
          nodes.push(node);
          grid[r][c] = node;
        }
      }

      // Connect adjacent nodes orthogonally to form circuit busses & branches
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          const current = grid[r][c];

          // Horizontal branch (connect to right)
          if (c < cols) {
            const hash = (r * 17 + c * 31) % 10;
            if (hash > (isMobile ? 5 : 4)) {
              const right = grid[r][c + 1];
              const seg = { from: current, to: right, dir: "x", length: stepX };
              segments.push(seg);
              current.connections.push(right);
              right.connections.push(current);
              current.adjacentSegments.push({ neighbor: right, segment: seg });
              right.adjacentSegments.push({ neighbor: current, segment: seg });
            }
          }

          // Vertical branch (connect to below)
          if (r < rows) {
            const hash = (r * 23 + c * 43) % 10;
            if (hash > (isMobile ? 5 : 4)) {
              const down = grid[r + 1][c];
              const seg = { from: current, to: down, dir: "y", length: stepY };
              segments.push(seg);
              current.connections.push(down);
              down.connections.push(current);
              current.adjacentSegments.push({ neighbor: down, segment: seg });
              down.adjacentSegments.push({ neighbor: current, segment: seg });
            }
          }
        }
      }

      // Mark endpoints for terminal circles
      nodes.forEach(n => {
        if (n.connections.length === 1 || n.connections.length === 3) {
          n.isEndpoint = true;
        }
      });

      // Initialize measured signal packets (calm, restrained)
      const signalCount = isMobile ? 2 : 5;
      if (segments.length > 0) {
        for (let i = 0; i < signalCount; i++) {
          const seg = segments[i % segments.length];
          signals.push({
            segment: seg,
            progress: (i / signalCount),
            speed: 0.0028 + ((i % 3) * 0.001), // calm, measured pace
            reversed: i % 2 === 1,
            length: isMobile ? 16 : 26, // packet length in pixels
          });
        }
      }
    }

    function resize() {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const isMobile = width < 768;
      buildNetwork(width, height, isMobile);

      // If reduced motion, draw static frame and stop
      if (isReducedMotion()) {
        drawFrame(true);
      }
    }

    // Pointer events on the hero wrapper
    const heroSection = canvas.closest(".hero") || canvas.parentElement;
    function onPointerMove(e) {
      if (!heroSection) return;
      const r = heroSection.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.active = true;
    }

    function onPointerLeave() {
      pointer.active = false;
      pointer.x = -1000;
      pointer.y = -1000;
    }

    // Draw a single frame
    function drawFrame(staticOnly = false) {
      if (!ctx || width === 0 || height === 0) return;

      ctx.clearRect(0, 0, width, height);

      // Dormant circuit bus lines (faint warm brass traces)
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(181, 154, 105, 0.16)";
      ctx.beginPath();
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        ctx.moveTo(seg.from.x, seg.from.y);
        ctx.lineTo(seg.to.x, seg.to.y);
      }
      ctx.stroke();

      // Render Junctions / Nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n.connections.length === 0) continue;

        // Interaction proximity boost
        let proximityBoost = 0;
        if (pointer.active && !staticOnly) {
          const dx = pointer.x - n.x;
          const dy = pointer.y - n.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 14400) { // 120px radius
            proximityBoost = Math.max(0, 1 - Math.sqrt(distSq) / 120);
          }
        }

        // Terminal ring
        const outerAlpha = 0.22 + proximityBoost * 0.45 + n.pulse * 0.4;
        ctx.fillStyle = `rgba(181, 154, 105, ${outerAlpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.isEndpoint ? 2.8 : 2.0, 0, Math.PI * 2);
        ctx.fill();

        // Active node pulse ring
        if (n.pulse > 0.05 && !staticOnly) {
          ctx.strokeStyle = `rgba(225, 197, 149, ${n.pulse * 0.5})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 3 + (1 - n.pulse) * 4, 0, Math.PI * 2);
          ctx.stroke();
          n.pulse *= 0.94; // smooth decay
        }
      }

      if (staticOnly) return;

      // Render Signal Pulses
      for (let i = 0; i < signals.length; i++) {
        const sig = signals[i];
        sig.progress += sig.speed;

        if (sig.progress >= 1) {
          sig.progress = 0;
          // Pulse the arrival node
          const targetNode = sig.reversed ? sig.segment.from : sig.segment.to;
          targetNode.pulse = 1.0;

          // Pick a next segment from the node if available (O(1) lookup)
          const adj = targetNode.adjacentSegments;
          if (adj && adj.length > 0) {
            const next = adj[Math.floor(Math.random() * adj.length)];
            sig.segment = next.segment;
            sig.reversed = next.segment.to === targetNode;
          }
        }

        // Interpolate signal position
        const fromX = sig.reversed ? sig.segment.to.x : sig.segment.from.x;
        const fromY = sig.reversed ? sig.segment.to.y : sig.segment.from.y;
        const toX = sig.reversed ? sig.segment.from.x : sig.segment.to.x;
        const toY = sig.reversed ? sig.segment.from.y : sig.segment.to.y;

        const deltaX = toX - fromX;
        const deltaY = toY - fromY;
        const totalDist = Math.hypot(deltaX, deltaY);
        if (totalDist === 0) continue;

        const unitX = deltaX / totalDist;
        const unitY = deltaY / totalDist;

        // Interpolate current head position along the segment
        const currentX = fromX + deltaX * sig.progress;
        const currentY = fromY + deltaY * sig.progress;

        // Draw glowing signal packet, clamping length to distance traveled so tail never overshoots starting node
        const headDist = sig.progress * totalDist;
        const packetLen = Math.min(sig.length, headDist);
        const tailX = currentX - unitX * packetLen;
        const tailY = currentY - unitY * packetLen;

        const grad = ctx.createLinearGradient(tailX, tailY, currentX, currentY);
        grad.addColorStop(0, "rgba(181, 154, 105, 0)");
        grad.addColorStop(0.7, "rgba(205, 183, 140, 0.45)");
        grad.addColorStop(1, "rgba(255, 243, 214, 0.95)");

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();

        // Tip terminal dot
        ctx.fillStyle = "rgba(255, 248, 230, 0.95)";
        ctx.beginPath();
        ctx.arc(currentX, currentY, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function tick() {
      if (isVisible && !isReducedMotion()) {
        drawFrame(false);
        animId = requestAnimationFrame(tick);
      }
    }

    // Visibility observer to pause canvas when scrolled away
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        isVisible = entry ? entry.isIntersecting : true;
        if (isVisible && !animId && !isReducedMotion()) {
          animId = requestAnimationFrame(tick);
        } else if (!isVisible && animId) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(canvas);

    // Page visibility (tab switch)
    function onVisibilityChange() {
      if (document.hidden) {
        if (animId) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      } else if (isVisible && !isReducedMotion()) {
        animId = requestAnimationFrame(tick);
      }
    }

    const hasHover = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(hover: hover)").matches;
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("resize", resize, { passive: true });
    if (hasHover) {
      heroSection?.addEventListener("pointermove", onPointerMove, { passive: true });
      heroSection?.addEventListener("pointerleave", onPointerLeave, { passive: true });
    }

    resize();
    if (!isReducedMotion()) {
      animId = requestAnimationFrame(tick);
    }

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("resize", resize);
      if (hasHover) {
        heroSection?.removeEventListener("pointermove", onPointerMove);
        heroSection?.removeEventListener("pointerleave", onPointerLeave);
      }
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="signal-flow-canvas"
      aria-hidden="true"
    />
  );
}
