import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';

/* ─── Types ─── */
interface VectorPoint {
  position: [number, number, number];
  label: string;
  category: 'document' | 'query';
  color: string;
}

/* ─── Utility: distance ─── */
function euclidean(a: [number, number, number], b: [number, number, number]) {
  return Math.sqrt(
    (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2,
  );
}

/* ─── Data Points ─── */
const DOCUMENT_POINTS: VectorPoint[] = [
  { position: [1.8, 2.1, 0.5], label: 'Machine Learning basics', category: 'document', color: '#6366f1' },
  { position: [-1.2, 1.5, 1.8], label: 'Neural network layers', category: 'document', color: '#6366f1' },
  { position: [2.5, -0.8, -1.2], label: 'Data preprocessing', category: 'document', color: '#6366f1' },
  { position: [-2.0, -1.5, 0.6], label: 'Gradient descent', category: 'document', color: '#6366f1' },
  { position: [0.5, -2.2, 2.0], label: 'Transformer architecture', category: 'document', color: '#6366f1' },
  { position: [-0.8, 2.5, -1.5], label: 'Tokenization methods', category: 'document', color: '#6366f1' },
  { position: [1.2, 0.3, -2.5], label: 'Vector databases', category: 'document', color: '#6366f1' },
  { position: [-2.5, 0.2, -0.8], label: 'Attention mechanism', category: 'document', color: '#6366f1' },
  { position: [0.2, 1.0, 2.8], label: 'Embedding models', category: 'document', color: '#6366f1' },
  { position: [-1.5, -2.0, -1.8], label: 'Fine-tuning LLMs', category: 'document', color: '#6366f1' },
  { position: [2.8, 1.5, 1.0], label: 'Prompt engineering', category: 'document', color: '#6366f1' },
  { position: [-0.5, -0.5, -2.2], label: 'Knowledge graphs', category: 'document', color: '#6366f1' },
  { position: [1.0, -1.5, -0.5], label: 'Cosine similarity', category: 'document', color: '#6366f1' },
  { position: [-1.8, 1.0, -2.0], label: 'RAG pipelines', category: 'document', color: '#6366f1' },
  { position: [0.8, 2.8, -0.2], label: 'Chunking strategies', category: 'document', color: '#6366f1' },
];

const K_NEAREST = 3;

/* ─── Particle Field (background decoration) ─── */
function ParticleField() {
  const count = 200;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      arr[i] = (Math.random() - 0.5) * 12;
    }
    return arr;
  }, []);

  const ref = useRef<THREE.Points>(null!);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.015;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#4f46e5" transparent opacity={0.25} sizeAttenuation />
    </points>
  );
}

/* ─── Connection Lines ─── */
function ConnectionLines({ from, targets }: { from: [number, number, number]; targets: [number, number, number][] }) {
  return (
    <>
      {targets.map((to, i) => {
        const points = [new THREE.Vector3(...from), new THREE.Vector3(...to)];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <line key={i} geometry={geometry}>
            <lineBasicMaterial color="#22d3ee" transparent opacity={0.6} linewidth={1} />
          </line>
        );
      })}
    </>
  );
}

/* ─── Draggable Query Sphere ─── */
function DraggableQuery({
  position,
  onDrag,
}: {
  position: [number, number, number];
  onDrag: (pos: [number, number, number]) => void;
}) {
  const mesh = useRef<THREE.Mesh>(null!);
  const [isDragging, setIsDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { camera, gl, raycaster, pointer } = useThree();
  const dragPlane = useRef(new THREE.Plane());
  const intersection = useRef(new THREE.Vector3());

  const onPointerDown = useCallback(
    (e: any) => {
      e.stopPropagation();
      setIsDragging(true);
      gl.domElement.style.cursor = 'grabbing';
      // Set up a drag plane perpendicular to camera
      const normal = new THREE.Vector3();
      camera.getWorldDirection(normal);
      dragPlane.current.setFromNormalAndCoplanarPoint(normal, mesh.current.position);
    },
    [camera, gl],
  );

  useEffect(() => {
    const onPointerMove = () => {
      if (!isDragging) return;
      raycaster.setFromCamera(pointer, camera);
      if (raycaster.ray.intersectPlane(dragPlane.current, intersection.current)) {
        const clamped: [number, number, number] = [
          THREE.MathUtils.clamp(intersection.current.x, -3.5, 3.5),
          THREE.MathUtils.clamp(intersection.current.y, -3.5, 3.5),
          THREE.MathUtils.clamp(intersection.current.z, -3.5, 3.5),
        ];
        onDrag(clamped);
      }
    };
    const onPointerUp = () => {
      if (isDragging) {
        setIsDragging(false);
        gl.domElement.style.cursor = 'auto';
      }
    };
    gl.domElement.addEventListener('pointermove', onPointerMove);
    gl.domElement.addEventListener('pointerup', onPointerUp);
    return () => {
      gl.domElement.removeEventListener('pointermove', onPointerMove);
      gl.domElement.removeEventListener('pointerup', onPointerUp);
    };
  }, [isDragging, camera, gl, raycaster, pointer, onDrag]);

  // Pulse animation
  const glowRef = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (glowRef.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 3) * 0.15;
      glowRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group position={position}>
      {/* Glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.1} />
      </mesh>
      {/* Main sphere */}
      <mesh
        ref={mesh}
        onPointerDown={onPointerDown}
        onPointerEnter={() => {
          setHovered(true);
          gl.domElement.style.cursor = 'grab';
        }}
        onPointerLeave={() => {
          if (!isDragging) {
            setHovered(false);
            gl.domElement.style.cursor = 'auto';
          }
        }}
      >
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial
          color={hovered || isDragging ? '#06b6d4' : '#22d3ee'}
          emissive={hovered || isDragging ? '#22d3ee' : '#0891b2'}
          emissiveIntensity={hovered || isDragging ? 0.8 : 0.4}
          metalness={0.3}
          roughness={0.2}
        />
      </mesh>
      {/* Label */}
      <Html center distanceFactor={8} style={{ pointerEvents: 'none' }}>
        <div style={{
          background: 'rgba(6, 182, 212, 0.15)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(34, 211, 238, 0.3)',
          borderRadius: '8px',
          padding: '4px 10px',
          color: '#0891b2',
          fontSize: '10px',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          fontFamily: "'Inter', sans-serif",
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          userSelect: 'none',
          transform: 'translateY(-28px)',
        }}>
          ⟐ YOUR QUERY
        </div>
      </Html>
    </group>
  );
}

/* ─── Document Point ─── */
function DocPoint({
  point,
  isNearest,
  rank,
}: {
  point: VectorPoint;
  isNearest: boolean;
  rank: number | null;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (ref.current) {
      const target = isNearest ? 0.18 : 0.1;
      const s = ref.current.scale.x;
      ref.current.scale.setScalar(THREE.MathUtils.lerp(s, target, 0.08));
    }
  });

  return (
    <group position={point.position}>
      <mesh
        ref={ref}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <sphereGeometry args={[1, 24, 24]} />
        <meshStandardMaterial
          color={isNearest ? '#a78bfa' : '#6366f1'}
          emissive={isNearest ? '#8b5cf6' : '#4f46e5'}
          emissiveIntensity={isNearest ? 0.6 : 0.15}
          metalness={0.2}
          roughness={0.4}
          transparent
          opacity={isNearest ? 1 : 0.55}
        />
      </mesh>

      {/* Rank badge for nearest */}
      {isNearest && rank !== null && (
        <Html center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(167, 139, 250, 0.4)',
            borderRadius: '12px',
            padding: '3px 8px',
            color: '#7c3aed',
            fontSize: '9px',
            fontWeight: 800,
            whiteSpace: 'nowrap',
            fontFamily: "'Inter', sans-serif",
            userSelect: 'none',
            transform: 'translateY(-20px)',
          }}>
            #{rank + 1} Match
          </div>
        </Html>
      )}

      {/* Hover label */}
      {hovered && (
        <Html center distanceFactor={8} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '10px',
            padding: '6px 12px',
            color: '#171717',
            fontSize: '11px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            fontFamily: "'Inter', sans-serif",
            userSelect: 'none',
            transform: 'translateY(24px)',
          }}>
            {point.label}
          </div>
        </Html>
      )}
    </group>
  );
}

/* ─── Axes Helper (subtle) ─── */
function AxesGuide() {
  const labels = [
    { text: 'Semantic X', pos: [4, 0, 0] as [number, number, number], color: '#f87171' },
    { text: 'Semantic Y', pos: [0, 4, 0] as [number, number, number], color: '#4ade80' },
    { text: 'Semantic Z', pos: [0, 0, 4] as [number, number, number], color: '#60a5fa' },
  ];

  return (
    <group>
      {/* Axis lines */}
      {[
        { from: [-4, 0, 0], to: [4, 0, 0], color: '#f87171' },
        { from: [0, -4, 0], to: [0, 4, 0], color: '#4ade80' },
        { from: [0, 0, -4], to: [0, 0, 4], color: '#60a5fa' },
      ].map((axis, i) => {
        const points = [
          new THREE.Vector3(...(axis.from as [number, number, number])),
          new THREE.Vector3(...(axis.to as [number, number, number])),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        return (
          <line key={i} geometry={geometry}>
            <lineBasicMaterial color={axis.color} transparent opacity={0.12} />
          </line>
        );
      })}

      {/* Labels */}
      {labels.map((l, i) => (
        <Html key={i} position={l.pos} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <span style={{
            color: l.color,
            fontSize: '8px',
            fontWeight: 700,
            fontFamily: "'Inter', sans-serif",
            opacity: 0.4,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            userSelect: 'none',
          }}>
            {l.text}
          </span>
        </Html>
      ))}
    </group>
  );
}

/* ─── Scene ─── */
function Scene() {
  const [queryPos, setQueryPos] = useState<[number, number, number]>([0, 0, 0]);

  // Compute K nearest neighbours
  const nearest = useMemo(() => {
    const distances = DOCUMENT_POINTS.map((p, i) => ({
      index: i,
      dist: euclidean(queryPos, p.position),
    }));
    distances.sort((a, b) => a.dist - b.dist);
    return distances.slice(0, K_NEAREST).map((d) => d.index);
  }, [queryPos]);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#e0e7ff" />
      <pointLight position={[-5, -3, -5]} intensity={0.4} color="#8b5cf6" />

      {/* Background particles */}
      <ParticleField />

      {/* Axes */}
      <AxesGuide />

      {/* Document points */}
      {DOCUMENT_POINTS.map((point, i) => (
        <DocPoint
          key={i}
          point={point}
          isNearest={nearest.includes(i)}
          rank={nearest.includes(i) ? nearest.indexOf(i) : null}
        />
      ))}

      {/* Connection lines to nearest */}
      <ConnectionLines
        from={queryPos}
        targets={nearest.map((i) => DOCUMENT_POINTS[i].position)}
      />

      {/* Draggable query */}
      <DraggableQuery position={queryPos} onDrag={setQueryPos} />

      {/* Controls */}
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={4}
        maxDistance={12}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

/* ─── Exported Component ─── */
export default function VectorCanvas() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{ position: [6, 4, 6], fov: 50 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene />
      </Canvas>

      {/* Overlay Instructions */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '12px',
          padding: '8px 16px',
          color: 'rgba(0, 0, 0, 0.6)',
          fontSize: '11px',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          userSelect: 'none',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>🖱</span>
            Drag the query sphere
          </span>
          <span style={{
            width: '1px',
            height: '14px',
            background: 'rgba(99, 102, 241, 0.3)',
          }} />
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>🔄</span>
            Orbit to explore
          </span>
        </div>
      </div>
    </div>
  );
}
