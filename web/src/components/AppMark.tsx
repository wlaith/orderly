import { CONTACT_ICON, Icon } from './Icon'


const files = import.meta.glob('../assets/apps/*.{svg,png}', { eager: true, import: 'default' }) as Record<string, string>
const official = (app: string) => {
  const k = Object.keys(files).find((f) => f.toLowerCase().includes(`/${app.toLowerCase()}.`))
  return k ? files[k] : undefined
}

export function AppMark({ app, size = 32 }: { app: string; size?: number }) {
  const src = official(app)
  if (src) return <img src={src} alt="" width={size} height={size} className="app-mark shrink-0 rounded-[24%] object-contain" style={{ width: size, height: size }} />
  return (
    <span className="app-mark app-mark-stand-in inline-flex shrink-0 items-center justify-center rounded-[24%] text-ink" style={{ width: size, height: size }} aria-hidden="true">
      <Icon name={CONTACT_ICON[app]} size={Math.round(size * 0.56)} bare />
    </span>
  )
}
