'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, useGLTF } from '@react-three/drei'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Coffee, Info, RotateCcw, Sparkles } from 'lucide-react'

const COLORS = [
  { name: 'Red', value: '#c9362b', ink: 'bg-[#c9362b]' },
  { name: 'Black', value: '#17231f', ink: 'bg-[#17231f]' },
  { name: 'Green', value: '#16804b', ink: 'bg-[#16804b]' },
  { name: 'Blue', value: '#2c62a8', ink: 'bg-[#2c62a8]' },
]

function ShirtMesh({ color, drawing, onDrawingChange, groupRef }: { color: string; drawing: boolean; onDrawingChange: (value: boolean) => void; groupRef: React.RefObject<THREE.Group | null> }) {
  const { scene } = useGLTF('/Shirt.glb')
  const shirt = useMemo(() => scene.clone(true), [scene])
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#f9f9f6'
    ctx.fillRect(0, 0, 1024, 1024)
    ctx.fillStyle = 'rgba(30, 48, 42, .035)'
    for (let i = 0; i < 1800; i++) ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 1, 1)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return tex
  }, [])
  const last = useRef<THREE.Vector2 | null>(null)

  useEffect(() => {
    shirt.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return
      object.castShadow = true
      object.receiveShadow = true
      const materials = Array.isArray(object.material) ? object.material : [object.material]
      materials.forEach((material) => {
        if (!('map' in material)) return
        material.map = texture
        material.needsUpdate = true
      })
    })
  }, [shirt, texture])

  const paint = useCallback((uv: THREE.Vector2) => {
    const canvas = texture.image as HTMLCanvasElement
    const ctx = canvas.getContext('2d')!
    const next = new THREE.Vector2(uv.x * canvas.width, (1 - uv.y) * canvas.height)
    ctx.strokeStyle = color
    ctx.lineWidth = 15
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (last.current) {
      ctx.beginPath()
      ctx.moveTo(last.current.x, last.current.y)
      ctx.lineTo(next.x, next.y)
      ctx.stroke()
    } else {
      ctx.beginPath(); ctx.arc(next.x, next.y, 7.5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill()
    }
    last.current = next
    texture.needsUpdate = true
  }, [color, texture])

  return (
    <group ref={groupRef} rotation={[0.02, 0, 0]} scale={2.35}>
      <primitive
        object={shirt}
        onPointerDown={(e: any) => { e.stopPropagation(); if (e.uv) { onDrawingChange(true); last.current = null; paint(e.uv) } }}
        onPointerMove={(e: any) => { if (drawing && e.uv) { e.stopPropagation(); paint(e.uv) } }}
        onPointerUp={(e: any) => { e.stopPropagation(); onDrawingChange(false); last.current = null }}
        onPointerOut={() => { if (drawing) { onDrawingChange(false); last.current = null } }}
      />
    </group>
  )
}

useGLTF.preload('/Shirt.glb')

function Scene({ color, drawing, setDrawing }: { color: string; drawing: boolean; setDrawing: (v: boolean) => void }) {
  const groupRef = useRef<THREE.Group>(null)
  const controlsRef = useRef<any>(null)
  const rotate = (axis: 'x' | 'y', amount: number) => { if (groupRef.current) groupRef.current.rotation[axis] += amount }
  return <div className="relative h-full w-full">
    <Canvas shadows camera={{ position: [0, 0.2, 7.4], fov: 34 }} onPointerMissed={() => setDrawing(false)}>
      <color attach="background" args={['#e9ede7']} />
      <ambientLight intensity={1.5} />
      <directionalLight castShadow position={[4, 6, 5]} intensity={3} shadow-mapSize={[2048, 2048]} />
      <directionalLight position={[-4, 2, 2]} intensity={1.1} color="#d7eadb" />
      <Environment preset="studio" />
      <ShirtMesh color={color} drawing={drawing} onDrawingChange={setDrawing} groupRef={groupRef} />
      <OrbitControls ref={controlsRef} enabled={!drawing} enablePan={false} minDistance={5} maxDistance={9} minPolarAngle={Math.PI / 2.45} maxPolarAngle={Math.PI / 1.7} dampingFactor={0.08} enableDamping />
    </Canvas>
    <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
      <div className="rounded-full border border-foreground/10 bg-background/75 px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">{drawing ? 'Writing on fabric…' : 'Drag to look around · Draw directly on the shirt'}</div>
    </div>
    <div className="absolute bottom-5 left-5 flex gap-2 rounded-2xl border border-foreground/10 bg-background/75 p-2 shadow-sm backdrop-blur">
      <button aria-label="Rotate left" onClick={() => rotate('y', -0.22)} className="control-button"><ArrowLeft size={16} /></button>
      <button aria-label="Rotate right" onClick={() => rotate('y', 0.22)} className="control-button"><ArrowRight size={16} /></button>
      <button aria-label="Rotate up" onClick={() => rotate('x', -0.16)} className="control-button"><ArrowUp size={16} /></button>
      <button aria-label="Rotate down" onClick={() => rotate('x', 0.16)} className="control-button"><ArrowDown size={16} /></button>
      <button aria-label="Reset rotation" onClick={() => { if (groupRef.current) groupRef.current.rotation.set(0.02, 0, 0) }} className="control-button border-l border-foreground/10 ml-1 pl-3"><RotateCcw size={15} /></button>
    </div>
  </div>
}

export function SignoutStudio() {
  const [active, setActive] = useState(COLORS[0])
  const [drawing, setDrawing] = useState(false)
  return <main className="min-h-screen bg-background text-foreground">
    <header className="flex items-center justify-between border-b border-foreground/10 px-5 py-4 md:px-10">
      <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Sparkles size={17} /></div><div><div className="font-serif text-lg font-bold tracking-tight">Sign-Out Studio</div><div className="font-mono text-[10px] uppercase tracking-[.2em] text-muted-foreground">Campus memories, signed in ink</div></div></div>
      <div className="hidden items-center gap-2 text-xs font-medium text-muted-foreground md:flex"><span className="h-2 w-2 rounded-full bg-[#16804b]" /> Live canvas · No account needed</div>
    </header>
    <div className="mx-auto flex max-w-[1500px] flex-col gap-6 px-5 py-6 md:px-10 lg:flex-row lg:gap-8 lg:py-8">
      <section className="min-w-0 flex-1">
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="mb-2 font-mono text-[11px] uppercase tracking-[.22em] text-[#16804b]">The digital sign-out wall</p><h1 className="max-w-2xl text-balance font-serif text-3xl font-bold tracking-tight md:text-5xl">Leave your mark on the shirt.</h1></div><p className="max-w-xs text-sm leading-6 text-muted-foreground">A digital white shirt for the friends, roommates and classmates who made university feel like home.</p></div>
        <div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-xs font-semibold text-muted-foreground">Choose your marker</span>{COLORS.map((item) => <button key={item.name} aria-label={`Use ${item.name} marker`} aria-pressed={active.name === item.name} onClick={() => setActive(item)} className={`marker ${item.ink} ${active.name === item.name ? 'marker-active' : ''}`}><span className="sr-only">{item.name}</span></button>)}</div><span className="hidden rounded-full bg-secondary px-3 py-1.5 text-[11px] font-medium text-secondary-foreground sm:block">{active.name} ink selected</span></div>
        <div className="h-[58vh] min-h-[440px] overflow-hidden rounded-[2rem] border border-foreground/10 shadow-[0_20px_60px_-35px_rgba(20,50,30,.35)] md:h-[640px]"><Scene color={active.value} drawing={drawing} setDrawing={setDrawing} /></div>
      </section>
      <aside className="w-full shrink-0 lg:w-[290px] lg:pt-[112px]"><div className="tipping-card"><div className="mb-8 flex items-start justify-between"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#16804b] text-primary-foreground"><Coffee size={21} /></div><span className="rounded-full border border-[#16804b]/25 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[#16804b]">Optional</span></div><h2 className="mb-2 font-serif text-2xl font-bold leading-tight">Sign-out Tipping Box<br /><span className="text-[#16804b]">(Buy Me a Coffee)</span></h2><p className="mb-7 text-sm leading-6 text-muted-foreground">If this little corner helped you revisit a good memory, you can keep the lights on.</p><button className="flex w-full items-center justify-between rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"><span>Leave a tip</span><span aria-hidden="true">→</span></button><div className="mt-5 flex gap-2 border-t border-foreground/10 pt-5 text-xs leading-5 text-muted-foreground"><Info size={15} className="mt-0.5 shrink-0" /> This is a placeholder for your preferred payment link.</div></div><div className="mt-4 rounded-2xl border border-foreground/10 bg-secondary/50 p-4"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">Tradition note</p><p className="mt-2 text-sm leading-6 text-foreground/75">White shirts become time capsules: names, jokes, wishes and one last goodbye before the next chapter.</p></div></aside>
    </div>
    <footer className="px-5 pb-7 pt-1 text-center font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground md:px-10">Made for the final week · University memories, kept in color</footer>
  </main>
}

export default SignoutStudio
