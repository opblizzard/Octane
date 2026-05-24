import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
export interface SeriesDef { key:string; color:string; label?:string }
const ACCENT_COLORS: Record<string,string> = { cyan:'var(--oct-accent-cyan)', amber:'var(--oct-accent-amber)', violet:'var(--oct-accent-violet)', rose:'var(--oct-accent-rose)', emerald:'var(--oct-accent-emerald)' }
type SimplePoint = { ts?:number; t?:number; value?:number; [key:string]:number|string|boolean|undefined }
interface Props { data:any[]; series?:SeriesDef[]; height?:number; showGrid?:boolean; showLegend?:boolean; unit?:string; accent?:string }
export function TimeSeriesChart({ data, series, height=180, showGrid=true, showLegend=false, unit:_unit, accent }: Props) {
  const resolvedColor = accent ? (ACCENT_COLORS[accent] ?? accent) : 'var(--accent)'
  const resolvedSeries: SeriesDef[] = series ?? [{ key:'value', color:resolvedColor }]
  // Normalize data: if points have ts/value shape, map to {t, value}
  const normalized = (data as SimplePoint[]).map(d => ({ t: d.t ?? d.ts ?? 0, ...d }))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={normalized} margin={{top:4,right:4,bottom:0,left:-20}}>
        {showGrid && <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" strokeOpacity={0.4}/>}
        <XAxis dataKey="t" hide tick={{fontSize:9,fill:'var(--muted)'}}/>
        <YAxis tick={{fontSize:9,fill:'var(--muted)'}}/>
        <Tooltip contentStyle={{background:'var(--surface)',border:'1px solid var(--border)',fontSize:10,borderRadius:4}} labelFormatter={()=>''}/>
        {showLegend && <Legend wrapperStyle={{fontSize:10}}/>}
        {resolvedSeries.map(s=>(
          <Line key={s.key} type="monotone" dataKey={s.key} stroke={s.color} strokeWidth={1.5} dot={false} name={s.label||s.key}
            style={{filter:`drop-shadow(0 0 3px ${s.color})`}}/>
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
