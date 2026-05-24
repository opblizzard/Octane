import { RadarChart as RechartRadar, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
export interface RadarDataPoint { subject?:string; label?:string; value:number; fullMark?:number }
interface DataPoint { subject?:string; label?:string; value:number; fullMark?:number }
interface Props { data:DataPoint[]; color?:string; accent?:string; height?:number; size?:number }
const ACCENT_COLORS: Record<string,string> = { cyan:'var(--oct-accent-cyan)', amber:'var(--oct-accent-amber)', violet:'var(--oct-accent-violet)', rose:'var(--oct-accent-rose)', emerald:'var(--oct-accent-emerald)' }
export function OctaneRadarChart({ data, color, accent, height=200, size }: Props) {
  const resolvedColor = color ?? (accent ? (ACCENT_COLORS[accent] ?? accent) : 'var(--accent)')
  const resolvedHeight = size ?? height
  // Normalize: accept both label and subject
  const normalized = data.map(d => ({ ...d, subject: d.subject ?? d.label ?? '' }))
  return (
    <ResponsiveContainer width="100%" height={resolvedHeight}>
      <RechartRadar data={normalized} margin={{top:8,right:16,bottom:8,left:16}}>
        <PolarGrid stroke="var(--border)" strokeOpacity={0.5}/>
        <PolarAngleAxis dataKey="subject" tick={{fontSize:9,fill:'var(--muted)'}}/>
        <Radar dataKey="value" stroke={resolvedColor} fill={resolvedColor} fillOpacity={0.15} strokeWidth={1.5}/>
        <Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--border)',fontSize:10}}/>
      </RechartRadar>
    </ResponsiveContainer>
  )
}
export { OctaneRadarChart as RadarChart }
