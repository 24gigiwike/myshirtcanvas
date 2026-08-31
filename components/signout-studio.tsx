'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Center, Environment, OrbitControls, useGLTF } from '@react-three/drei'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, RotateCcw } from 'lucide-react'

const SHIRT_MODEL_URL = 'https://res.cloudinary.com/dtkluxukm/image/upload/v1787995625/Shirt_nep9xf.glb'
const COLORS = [
  { name: 'Red', value: '#c9362b', ink: 'bg-[#c9362b]' },
  { name: 'Black', value: '#17231f', ink: 'bg-[#17231f]' },
  { name: 'Green', value: '#16804b', ink: 'bg-[#16804b]' },
  { name: 'Blue', value: '#2c62a8', ink: 'bg-[#2c62a8]' },
]

function ShirtMesh({ color, drawing, onDrawingChange, groupRef }: { color: string; drawing: boolean; onDrawingChange: (value: boolean) => void; groupRef: React.RefObject<THREE.Group | null> }) {
  const { scene } = useGLTF(SHIRT_MODEL_URL)
  const shirt = useMemo(() => scene.clone(true), [scene])
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 1024
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#f9f9f6'; ctx.fillRect(0, 0, 1024, 1024)
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return tex
  }, [])
  const last = useRef<THREE.Vector2 | null>(null)
  useEffect(() => { shirt.traverse((object) => { if (!(object instanceof THREE.Mesh)) return; object.castShadow = true; object.receiveShadow = true; const materials = Array.isArray(object.material) ? object.material : [object.material]; materials.forEach((material) => { if ('map' in material) { material.map = texture; material.needsUpdate = true } }) }) }, [shirt, texture])
  const paint = useCallback((uv: THREE.Vector2) => { const canvas = texture.image as HTMLCanvasElement; const ctx = canvas.getContext('2d')!; const next = new THREE.Vector2(uv.x * canvas.width, (1 - uv.y) * canvas.height); ctx.strokeStyle = color; ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); if (last.current) { ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(next.x, next.y); ctx.stroke() } else { ctx.arc(next.x, next.y, 7.5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill() } last.current = next; texture.needsUpdate = true }, [color, texture])
  return <group ref={groupRef} rotation={[0.02, 0, 0]} scale={[0.42, 0.42, 0.42]}><primitive object={shirt} onPointerDown={(e: any) => { e.stopPropagation(); if (e.uv) { onDrawingChange(true); last.current = null; paint(e.uv) } }} onPointerMove={(e: any) => { if (drawing && e.uv) { e.stopPropagation(); paint(e.uv) } }} onPointerUp={(e: any) => { e.stopPropagation(); onDrawingChange(false); last.current = null }} onPointerOut={() => { if (drawing) { onDrawingChange(false); last.current = null } }} /></group>
}
useGLTF.preload(SHIRT_MODEL_URL)

function CameraController({ zoomLevel, controlsRef }: { zoomLevel: number; controlsRef: React.RefObject<any> }) { const target = useMemo(() => new THREE.Vector3(), []); useFrame((state) => { target.set(0, 0, zoomLevel); state.camera.position.lerp(target, 0.1); state.camera.updateProjectionMatrix(); controlsRef.current?.update() }); return null }

function Scene({ color, drawing, setDrawing, zoomLevel, groupRef }: { color: string; drawing: boolean; setDrawing: (v: boolean) => void; zoomLevel: number; groupRef: React.RefObject<THREE.Group | null> }) {
  const controlsRef = useRef<any>(null)
  return <Canvas shadows camera={{ position: [0, 0, zoomLevel], fov: 45 }} onPointerMissed={() => setDrawing(false)}><color attach="background" args={['#0eb0ab']} /><ambientLight intensity={1.5} /><directionalLight castShadow position={[4, 6, 5]} intensity={2} /><Environment preset="studio" /><CameraController zoomLevel={zoomLevel} controlsRef={controlsRef} /><Suspense fallback={null}><Center disableY={false} disableX={false} disableZ={false}><ShirtMesh color={color} drawing={drawing} onDrawingChange={setDrawing} groupRef={groupRef} /></Center></Suspense><OrbitControls ref={controlsRef} makeDefault enabled={!drawing} enablePan={false} minDistance={1.5} maxDistance={8} enableDamping dampingFactor={0.08} /></Canvas>
}

function Marker({ item, active, onClick }: { item: typeof COLORS[number]; active: boolean; onClick: () => void }) { return <button type="button" aria-label={`Use ${item.name} marker`} aria-pressed={active} onClick={onClick} className={`group relative flex h-8 w-8 items-center justify-center rounded-md transition-all ${active ? 'bg-white/20 ring-2 ring-white' : 'hover:bg-white/10'}`}><span className={`relative h-9 w-2.5 rounded-b-full rounded-t-sm ${item.ink} shadow-[2px_4px_0_rgba(0,0,0,.18)]`}><span className="absolute -top-1 left-0 h-2 w-3 rounded-t-sm bg-white/50" /><span className="absolute -bottom-2 left-[3px] h-2 w-1.5 border-x-[3px] border-t-4 border-transparent border-t-current" /></span><span className="sr-only">{item.name}</span></button> }

export function SignoutStudio() {
  const [active, setActive] = useState(COLORS[0]); const [drawing, setDrawing] = useState(false); const [zoomLevel, setZoomLevel] = useState(4); const [markerTrayOpen, setMarkerTrayOpen] = useState(false); const groupRef = useRef<THREE.Group>(null)
  const rotate = (axis: 'x' | 'y', amount: number) => { if (groupRef.current) groupRef.current.rotation[axis] += amount }
  const chooseMarker = (item: typeof COLORS[number]) => { setActive(item); setMarkerTrayOpen(false) }
  return <main className="relative h-dvh w-full overflow-hidden bg-[#0eb0ab]"><div className="absolute inset-0"><Scene color={active.value} drawing={drawing} setDrawing={setDrawing} zoomLevel={zoomLevel} groupRef={groupRef} /></div><aside className="absolute right-3 top-1/2 z-10 flex w-12 -translate-y-1/2 flex-col items-center gap-1 rounded-2xl border border-white/30 bg-[#087f7b]/70 p-1 shadow-2xl backdrop-blur-xl"><div className={`${markerTrayOpen ? 'flex' : 'hidden'} absolute right-0 bottom-full mb-1 w-12 flex-col items-center justify-center gap-1 rounded-xl border border-white/25 bg-[#087f7b]/95 p-1 shadow-xl backdrop-blur-xl md:hidden`}>{COLORS.map((item) => <Marker key={item.name} item={item} active={active.name === item.name} onClick={() => chooseMarker(item)} />)}</div><div className="flex items-center gap-0.5 md:flex-col"><div className="flex items-center md:hidden"><Marker item={active} active onClick={() => setMarkerTrayOpen((open) => !open)} /><button type="button" aria-label="Toggle marker colors" aria-expanded={markerTrayOpen} onClick={() => setMarkerTrayOpen((open) => !open)} className="px-0.5 text-[10px] leading-none text-white">⌄</button></div><div className="hidden md:flex md:flex-col md:gap-1">{COLORS.map((item) => <Marker key={item.name} item={item} active={active.name === item.name} onClick={() => chooseMarker(item)} />)}</div></div><div className="h-px w-8 bg-white/30" /><div className="flex flex-col gap-1"><button type="button" aria-label="Rotate left" onClick={() => rotate('y', -0.22)} className="studio-control"><ArrowLeft size={15} /></button><button type="button" aria-label="Rotate right" onClick={() => rotate('y', 0.22)} className="studio-control"><ArrowRight size={15} /></button><button type="button" aria-label="Rotate up" onClick={() => rotate('x', -0.16)} className="studio-control"><ArrowUp size={15} /></button><button type="button" aria-label="Rotate down" onClick={() => rotate('x', 0.16)} className="studio-control"><ArrowDown size={15} /></button><button type="button" aria-label="Reset rotation" onClick={() => groupRef.current?.rotation.set(0.02, 0, 0)} className="studio-control"><RotateCcw size={14} /></button></div><div className="h-px w-8 bg-white/30" /><div className="flex flex-col gap-1"><button type="button" aria-label="Zoom out" onClick={() => setZoomLevel((v) => Math.min(8, v + 0.5))} className="studio-control text-lg">−</button><button type="button" aria-label="Zoom in" onClick={() => setZoomLevel((v) => Math.max(1.5, v - 0.5))} className="studio-control text-lg">+</button></div></aside></main> }
export default SignoutStudio
